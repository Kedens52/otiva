import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { z } from "zod"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createTbankToken, TBANK_INIT_URL, tbankConfig } from "@/lib/tbank"

export const dynamic = "force-dynamic"

const topUpSchema = z.object({
  amount: z.number().int().min(100).max(500_000),
})

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 })

    const [account, transactions] = await Promise.all([
      prisma.user.findUnique({
        where: { id: user.id },
        select: { walletBalance: true },
      }),
      prisma.walletTransaction.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true, type: true, status: true,
          amount: true, balanceAfter: true,
          title: true, listingId: true, createdAt: true,
        },
      }),
    ])

    return NextResponse.json({
      balance: account?.walletBalance ?? 0,
      transactions,
    })
  } catch (error) {
    console.error("wallet GET error:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 })

    const body = await request.json()
    const { amount } = topUpSchema.parse(body)

    const config = tbankConfig()
    if (!config) {
      return NextResponse.json({ error: "Платёжный шлюз не настроен" }, { status: 503 })
    }

    // amount в рублях → T-Bank принимает копейки
    const amountKopecks = amount * 100

    const orderId = `wallet_${crypto.randomBytes(10).toString("hex")}`

    // Создаём запись платежа
    const payment = await prisma.payment.create({
      data: {
        orderId,
        userId: user.id,
        serviceType: "wallet_topup",
        amount: amountKopecks,
        status: "PENDING",
      },
    })

    const initPayload = {
      TerminalKey:     config.terminalKey,
      Amount:          amountKopecks,
      OrderId:         orderId,
      Description:     "Пополнение баланса Нашло",
      SuccessURL:      config.successUrl + "?type=wallet",
      FailURL:         config.failUrl + "?type=wallet",
      NotificationURL: config.notificationUrl,
      CustomerKey:     user.id,
      DATA: {
        userId:      user.id,
        serviceType: "wallet_topup",
        connection_type: "API",
      },
    }

    const token = createTbankToken(initPayload, config.password)

    const tbankRes = await fetch(TBANK_INIT_URL, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ ...initPayload, Token: token }),
      cache:   "no-store",
    })

    const data = await tbankRes.json().catch(() => ({}))

    if (!tbankRes.ok || !data.Success || !data.PaymentURL) {
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
        paymentUrl:     String(data.PaymentURL),
        raw:            data,
      },
    })

    return NextResponse.json({
      orderId,
      paymentId:  data.PaymentId,
      paymentUrl: data.PaymentURL,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error("wallet POST error:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}
