import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateOtpCode, sendSmsCode, formatPhone } from '@/lib/auth'
import { z } from 'zod'

const schema = z.object({
  phone: z.string().min(10).max(15),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone } = schema.parse(body)
    const normalizedPhone = formatPhone(phone)

    // Rate limiting: max 3 codes per phone per 10 minutes
    const recentCodes = await prisma.otpCode.count({
      where: {
        phone: normalizedPhone,
        createdAt: { gte: new Date(Date.now() - 10 * 60 * 1000) },
      },
    })

    if (recentCodes >= 3) {
      return NextResponse.json(
        { error: 'Слишком много попыток. Подождите 10 минут.' },
        { status: 429 }
      )
    }

    // Invalidate previous codes
    await prisma.otpCode.updateMany({
      where: { phone: normalizedPhone, used: false },
      data: { used: true },
    })

    const code = generateOtpCode()
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 min

    await prisma.otpCode.create({
      data: {
        phone: normalizedPhone,
        code,
        expiresAt,
      },
    })

    await sendSmsCode(normalizedPhone, code)

    return NextResponse.json({ message: 'Код отправлен', phone: normalizedPhone })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Неверный формат номера' }, { status: 400 })
    }
    console.error('send-code error:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
