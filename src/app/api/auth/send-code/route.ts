import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { generateOtpCode, sendSmsCode, formatPhone } from "@/lib/auth"
import { AUTH_LIMITS, checkSendCodeIpLimit, getClientIp } from "@/lib/auth-rate-limit"
import { z } from "zod"

const schema = z.object({
  phone: z.string().min(10).max(15),
})

export async function POST(request: NextRequest) {
  try {
    if (!(await checkSendCodeIpLimit(request))) {
      return NextResponse.json(
        { error: "Слишком много запросов с вашего IP. Попробуйте через час." },
        { status: 429 },
      )
    }

    const body = await request.json()
    const { phone } = schema.parse(body)
    const normalizedPhone = formatPhone(phone)

    const existingUser = await prisma.user.findUnique({
      where: { phone: normalizedPhone },
      select: { id: true },
    })

    const recentCodes = await prisma.otpCode.count({
      where: {
        phone: normalizedPhone,
        createdAt: { gte: new Date(Date.now() - 10 * 60 * 1000) },
      },
    })

    if (recentCodes >= AUTH_LIMITS.sendCodePerPhone10Min) {
      return NextResponse.json(
        { error: "Слишком много попыток. Подождите 10 минут." },
        { status: 429 },
      )
    }

    await prisma.otpCode.updateMany({
      where: { phone: normalizedPhone, used: false },
      data: { used: true },
    })

    const code = generateOtpCode()
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000)

    await prisma.otpCode.create({
      data: {
        phone: normalizedPhone,
        code,
        expiresAt,
      },
    })

    await sendSmsCode(normalizedPhone, code)

    return NextResponse.json({
      message: existingUser
        ? "Код отправлен. У вас уже есть аккаунт — введите код для входа."
        : "Код отправлен",
      phone: normalizedPhone,
      accountExists: Boolean(existingUser),
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Неверный формат номера телефона" }, { status: 400 })
    }
    console.error("send-code error:", error)
    return NextResponse.json({ error: "Не удалось отправить код. Попробуйте позже." }, { status: 500 })
  }
}
