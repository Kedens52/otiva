import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession, signToken, setAuthCookie, formatPhone } from "@/lib/auth"
import { findOrCreatePhoneUser, RegistrationRateLimitError } from "@/lib/oauth-users"
import { recalculateUserTrust } from "@/lib/user-trust-engine"
import { recordRegistrationVisit, recordUserLogin } from "@/lib/analytics/record-visit"
import {
  checkNewRegistrationIpLimit,
  checkVerifyIpLimit,
  checkVerifyPhoneFailLimit,
  getClientIp,
} from "@/lib/auth-rate-limit"
import { z } from "zod"

export const dynamic = "force-dynamic"

const schema = z.object({
  phone: z.string().min(10).max(15),
  code: z.string().length(6),
  referralCode: z.string().max(32).optional(),
})

export async function POST(request: NextRequest) {
  try {
    if (!(await checkVerifyIpLimit(request))) {
      return NextResponse.json(
        { error: "Слишком много попыток входа. Подождите 15 минут." },
        { status: 429 },
      )
    }

    const body = await request.json()
    const { phone, code, referralCode } = schema.parse(body)
    const normalizedPhone = formatPhone(phone)

    const otpRecord = await prisma.otpCode.findFirst({
      where: {
        phone: normalizedPhone,
        code,
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    })

    if (!otpRecord) {
      if (!checkVerifyPhoneFailLimit(normalizedPhone)) {
        return NextResponse.json(
          { error: "Слишком много неверных попыток. Запросите новый код через 15 минут." },
          { status: 429 },
        )
      }
      return NextResponse.json(
        { error: "Неверный или истёкший код. Запросите новый." },
        { status: 400 },
      )
    }

    await prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { used: true },
    })

    const session = await getSession()
    const clientIp = getClientIp(request)

    let user: Awaited<ReturnType<typeof findOrCreatePhoneUser>>["user"]
    let isNew: boolean

    try {
      const result = await findOrCreatePhoneUser(normalizedPhone, {
        preferredUserId: session?.userId,
        assertCanRegister: async () => {
          if (!(await checkNewRegistrationIpLimit(request))) {
            throw new RegistrationRateLimitError()
          }
        },
      })
      user = result.user
      isNew = result.isNew
    } catch (error) {
      if (error instanceof RegistrationRateLimitError) {
        return NextResponse.json(
          {
            error:
              "С этого устройства или IP уже создано несколько аккаунтов. Войдите в существующий или попробуйте позже.",
          },
          { status: 429 },
        )
      }
      throw error
    }

    if (user.isBanned) {
      return NextResponse.json({ error: "Аккаунт заблокирован. Обратитесь в поддержку." }, { status: 403 })
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date(), lastLoginIp: clientIp },
    })

    const token = await signToken({
      userId: user.id,
      phone: user.phone || "",
      role: user.role,
    })

    setAuthCookie(token)

    if (isNew) {
      void recordRegistrationVisit(request, user.id, "phone")
      const { tryWelcomeBonus, applyReferralCode } = await import("@/lib/bonuses/hooks")
      void tryWelcomeBonus(user.id, prisma).catch(() => {})
      if (referralCode?.trim()) {
        void applyReferralCode(user.id, referralCode, prisma).catch(() => {})
      }
    } else {
      void recordUserLogin(request, user.id, "phone")
    }

    const { tryPhoneVerifiedBonus } = await import("@/lib/bonuses/hooks")
    void tryPhoneVerifiedBonus(user.id, prisma).catch(() => {})
    void recalculateUserTrust(user.id).catch(() => {})

    return NextResponse.json({
      message: isNew ? "Регистрация завершена" : "Вы вошли в существующий аккаунт",
      isNew,
      accountExists: !isNew,
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        name: user.name,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        role: user.role,
        authProviders: {
          phone: Boolean(user.phone),
          vk: Boolean(user.vkId),
          yandex: Boolean(user.yandexId),
        },
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Проверьте номер телефона и код из SMS" }, { status: 400 })
    }
    console.error("verify-code error:", error)
    return NextResponse.json({ error: "Ошибка сервера. Попробуйте позже." }, { status: 500 })
  }
}
