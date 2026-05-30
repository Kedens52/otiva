import crypto from "crypto"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createTbankToken, fetchTbankSbpQrSvg, TBANK_INIT_URL, tbankConfig } from "@/lib/tbank"
import { resolvePaymentAmount } from "@/lib/payment-pricing"

export const dynamic = "force-dynamic"

const createSchema = z.object({
  userId: z.string().optional(),
  listingId: z.string().optional().nullable(),
  serviceType: z.string().min(2).max(80),
  /** Только для пополнения кошелька (рубли). Для остальных услуг сумма на сервере. */
  amountRubles: z.number().int().min(100).max(500_000).optional(),
  amount: z.number().int().optional(),
  durationDays: z.number().int().positive().optional(),
  connectionType: z.string().optional(),
  /** Вернуть SVG QR СБП (GetQr) для отображения на сайте */
  withSbpQr: z.boolean().optional(),
})

function serviceDescription(serviceType: string) {
  const normalized = serviceType.toLowerCase()
  if (normalized.includes("wallet")) return "Пополнение баланса Нашло"
  if (normalized.includes("promotion") || normalized.includes("promote")) {
    return "Продвижение объявления на Нашло"
  }
  if (normalized.includes("ad")) return "Рекламная услуга Нашло"
  return "Платная услуга Нашло"
}

export async function POST(request: NextRequest) {
  try {
    const config = tbankConfig()
    if (!config) {
      return NextResponse.json({ error: "Платежи Т-Банка не настроены" }, { status: 500 })
    }

    const currentUser = await getCurrentUser()
    if (!currentUser) return NextResponse.json({ error: "Не авторизован" }, { status: 401 })

    const body = await request.json()
    const input = createSchema.parse(body)
    const userId = input.userId || currentUser.id
    const isAdmin = ["ADMIN", "MODERATOR"].includes(currentUser.role)

    if (userId !== currentUser.id && !isAdmin) {
      return NextResponse.json({ error: "Нет доступа" }, { status: 403 })
    }

    const amountRubles =
      input.amountRubles ??
      (input.amount != null ? Math.round(input.amount / 100) : undefined)

    const pricing = resolvePaymentAmount({
      serviceType: input.serviceType,
      amountRubles,
      durationDays: input.durationDays,
    })

    if (!pricing.ok) {
      return NextResponse.json({ error: pricing.error }, { status: 400 })
    }

    if (input.listingId) {
      const listing = await prisma.listing.findUnique({
        where: { id: input.listingId },
        select: { sellerId: true },
      })
      if (!listing) return NextResponse.json({ error: "Объявление не найдено" }, { status: 404 })
      if (listing.sellerId !== userId && !isAdmin) {
        return NextResponse.json({ error: "Нет доступа к объявлению" }, { status: 403 })
      }
    }

    const orderId = `nsh_${crypto.randomUUID().replace(/-/g, "").slice(0, 20)}`
    const payment = await prisma.payment.create({
      data: {
        orderId,
        userId,
        listingId: input.listingId || null,
        serviceType: pricing.serviceType,
        amount: pricing.amountKopecks,
        status: "PENDING",
      },
    })

    const isWallet = pricing.serviceType === "wallet_topup"
    const initPayload = {
      TerminalKey: config.terminalKey,
      Amount: pricing.amountKopecks,
      OrderId: orderId,
      Description: serviceDescription(pricing.serviceType),
      SuccessURL: isWallet ? `${config.successUrl}?type=wallet` : config.successUrl,
      FailURL: isWallet ? `${config.failUrl}?type=wallet` : config.failUrl,
      NotificationURL: config.notificationUrl,
      CustomerKey: userId,
      DATA: {
        userId,
        listingId: input.listingId || "",
        serviceType: pricing.serviceType,
        connection_type: input.connectionType || "Widget",
      },
    }

    const token = createTbankToken(initPayload, config.password)
    const initRes = await fetch(TBANK_INIT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(config.apiToken ? { Authorization: `Bearer ${config.apiToken}` } : {}),
      },
      body: JSON.stringify({ ...initPayload, Token: token }),
      cache: "no-store",
    })

    const data = await initRes.json().catch(() => ({}))
    if (!initRes.ok || !data.Success || !data.PaymentURL) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "FAILED",
          raw: data,
          tbankPaymentId: data.PaymentId ? String(data.PaymentId) : null,
        },
      })
      return NextResponse.json(
        { error: data.Message || data.Details || "Т-Банк не создал платёж" },
        { status: 502 },
      )
    }

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        tbankPaymentId: String(data.PaymentId),
        paymentUrl: String(data.PaymentURL),
        raw: data,
      },
    })

    let qrSvg: string | null = null
    if (input.withSbpQr && data.PaymentId != null) {
      qrSvg = await fetchTbankSbpQrSvg(data.PaymentId, config)
    }

    return NextResponse.json({
      orderId,
      paymentId: data.PaymentId,
      paymentUrl: data.PaymentURL,
      PaymentURL: data.PaymentURL,
      qrSvg,
      amount: pricing.amountKopecks,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Неверные данные платежа" }, { status: 400 })
    }
    console.error("tbank create error:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}
