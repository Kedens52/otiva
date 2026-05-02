import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { signToken, setAuthCookie } from '@/lib/auth'
import { z } from 'zod'

const schema = z.object({
  access_token: z.string(),
  user_id: z.union([z.number(), z.string()]),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { access_token, user_id } = schema.parse(body)

    // Получаем данные пользователя из VK
    const userRes = await fetch(
      `https://api.vk.com/method/users.get?user_ids=${String(user_id)}&fields=photo_200,city&access_token=${access_token}&v=5.131`
    )
    const userData = await userRes.json()
    const vkUser = userData.response?.[0]

    if (!vkUser) {
      return NextResponse.json({ error: 'Не удалось получить данные VK' }, { status: 400 })
    }

    const vkId = String(vkUser.id)
    const name = `${vkUser.first_name} ${vkUser.last_name}`.trim()
    const avatar = vkUser.photo_200 || null
    const city = vkUser.city?.title || null

    // Ищем или создаём пользователя
    let user = await prisma.user.findUnique({ where: { vkId } })

    if (user) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          name: user.name || name,
          avatar: user.avatar || avatar,
        },
      })
    } else {
      user = await prisma.user.create({
        data: { vkId, name, avatar, city },
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

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('VK token error:', error)
    return NextResponse.json({ error: 'Ошибка авторизации' }, { status: 500 })
  }
}
