import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { signToken, setAuthCookie, formatPhone } from '@/lib/auth'
import { z } from 'zod'

const schema = z.object({
  phone: z.string().min(10).max(15),
  code: z.string().length(6),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone, code } = schema.parse(body)
    const normalizedPhone = formatPhone(phone)

    const otpRecord = await prisma.otpCode.findFirst({
      where: {
        phone: normalizedPhone,
        code,
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    })

    if (!otpRecord) {
      return NextResponse.json(
        { error: 'Неверный или истёкший код' },
        { status: 400 }
      )
    }

    // Mark code as used
    await prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { used: true },
    })

    // Find or create user
    let isNew = false
    let user = await prisma.user.findUnique({
      where: { phone: normalizedPhone },
    })

    if (!user) {
      isNew = true
      user = await prisma.user.create({
        data: {
          phone: normalizedPhone,
          isVerified: true,
        },
      })
    } else if (!user.isVerified) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { isVerified: true },
      })
    }

    if (user.isBanned) {
      return NextResponse.json({ error: 'Аккаунт заблокирован' }, { status: 403 })
    }

    const token = await signToken({
      userId: user.id,
      phone: user.phone || '',
      role: user.role,
    })

    setAuthCookie(token)

    return NextResponse.json({
      message: 'Успешная авторизация',
      isNew,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Неверные данные' }, { status: 400 })
    }
    console.error('verify-code error:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
