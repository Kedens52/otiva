import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { signToken, COOKIE_NAME, COOKIE_OPTIONS } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const code = searchParams.get('code')
  const next = searchParams.get('state') || '/profile'
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://nashlo.ru'

  if (!code) {
    return NextResponse.redirect(`${baseUrl}/login?error=vk_denied`)
  }

  try {
    const redirectUri = `${baseUrl}/api/auth/vk/callback`

    // Обмен кода на токен
    const tokenRes = await fetch(
      `https://oauth.vk.com/access_token?client_id=${process.env.VK_CLIENT_ID}&client_secret=${process.env.VK_CLIENT_SECRET}&redirect_uri=${redirectUri}&code=${code}`
    )
    const tokenData = await tokenRes.json()

    if (tokenData.error) {
      console.error('VK token error:', tokenData)
      return NextResponse.redirect(`${baseUrl}/login?error=vk_token`)
    }

    const { access_token, user_id, email } = tokenData

    // Получаем данные пользователя
    const userRes = await fetch(
      `https://api.vk.com/method/users.get?user_ids=${user_id}&fields=photo_200,city&access_token=${access_token}&v=5.131`
    )
    const userData = await userRes.json()
    const vkUser = userData.response?.[0]

    if (!vkUser) {
      return NextResponse.redirect(`${baseUrl}/login?error=vk_user`)
    }

    const vkId = String(vkUser.id)
    const name = `${vkUser.first_name} ${vkUser.last_name}`.trim()
    const avatar = vkUser.photo_200 || null
    const city = vkUser.city?.title || null

    // Ищем или создаём пользователя
    let user = await prisma.user.findUnique({ where: { vkId } })

    if (!user && email) {
      user = await prisma.user.findUnique({ where: { email } })
    }

    if (user) {
      // Обновляем данные
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          vkId,
          name: user.name || name,
          avatar: user.avatar || avatar,
        },
      })
    } else {
      // Создаём нового
      user = await prisma.user.create({
        data: {
          vkId,
          email: email || null,
          name,
          avatar,
          city,
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

    const response = NextResponse.redirect(`${baseUrl}${next.startsWith('/') ? next : '/profile'}`)
    response.cookies.set(COOKIE_NAME, token, COOKIE_OPTIONS)
    return response
  } catch (error) {
    console.error('VK OAuth error:', error)
    return NextResponse.redirect(`${baseUrl}/login?error=vk_error`)
  }
}
