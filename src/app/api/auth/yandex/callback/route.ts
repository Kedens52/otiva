import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { signToken, COOKIE_NAME, COOKIE_OPTIONS } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const code = searchParams.get('code')
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://nashlo.ru'

  if (!code) {
    return NextResponse.redirect(`${baseUrl}/login?error=yandex_denied`)
  }

  try {
    const redirectUri = `${baseUrl}/api/auth/yandex/callback`

    // Обмен кода на токен
    const tokenRes = await fetch('https://oauth.yandex.ru/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: process.env.YANDEX_CLIENT_ID!,
        client_secret: process.env.YANDEX_CLIENT_SECRET!,
        redirect_uri: redirectUri,
      }),
    })

    const tokenData = await tokenRes.json()

    if (tokenData.error) {
      console.error('Yandex token error:', tokenData)
      return NextResponse.redirect(`${baseUrl}/login?error=yandex_token`)
    }

    // Получаем данные пользователя
    const userRes = await fetch('https://login.yandex.ru/info?format=json', {
      headers: { Authorization: `OAuth ${tokenData.access_token}` },
    })
    const yandexUser = await userRes.json()

    if (!yandexUser.id) {
      return NextResponse.redirect(`${baseUrl}/login?error=yandex_user`)
    }

    const yandexId = String(yandexUser.id)
    const name = yandexUser.real_name || yandexUser.login || ''
    const email = yandexUser.default_email || null
    const avatar = yandexUser.default_avatar_id
      ? `https://avatars.yandex.net/get-yapic/${yandexUser.default_avatar_id}/islands-200`
      : null

    // Ищем или создаём пользователя
    let user = await prisma.user.findUnique({ where: { yandexId } })

    if (!user && email) {
      user = await prisma.user.findUnique({ where: { email } })
    }

    if (user) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          yandexId,
          name: user.name || name,
          avatar: user.avatar || avatar,
        },
      })
    } else {
      user = await prisma.user.create({
        data: {
          yandexId,
          email,
          name,
          avatar,
        },
      })
    }

    if (user.isBanned) {
      return NextResponse.redirect(`${baseUrl}/login?error=banned`)
    }

    const token = await signToken({
      userId: user.id,
      phone: user.phone || '',
      role: user.role,
    })

    const response = NextResponse.redirect(`${baseUrl}/profile`)
    response.cookies.set(COOKIE_NAME, token, COOKIE_OPTIONS)
    return response
  } catch (error) {
    console.error('Yandex OAuth error:', error)
    return NextResponse.redirect(`${baseUrl}/login?error=yandex_error`)
  }
}
