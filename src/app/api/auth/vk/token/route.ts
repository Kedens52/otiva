import { NextRequest, NextResponse } from "next/server"
import { getSession, signToken, setAuthCookie } from "@/lib/auth"
import { findOrCreateOAuthUser } from "@/lib/oauth-users"

type VkPayload = {
  access_token?: string
  id_token?: string
  user_id?: number | string
  user?: Record<string, unknown>
  email?: string
}

type VkProfile = {
  vkId: string
  name: string
  avatar: string | null
  city: string | null
  email: string | null
  phone: string | null
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null
}

function decodeJwtPayload(token?: string): Record<string, unknown> | null {
  if (!token) return null
  try {
    const [, payload] = token.split(".")
    if (!payload) return null
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/")
    const decoded = Buffer.from(normalized, "base64").toString("utf8")
    return JSON.parse(decoded)
  } catch {
    return null
  }
}

function profileFromObject(data: Record<string, unknown> | null, fallbackId?: string, fallbackEmail?: string | null): VkProfile | null {
  if (!data) return null

  const rawId =
    data.user_id ??
    data.id ??
    data.sub ??
    fallbackId

  if (rawId === undefined || rawId === null || String(rawId).trim() === "") return null

  const firstName = text(data.first_name) ?? text(data.given_name) ?? ""
  const lastName = text(data.last_name) ?? text(data.family_name) ?? ""
  const fullName = text(data.name) ?? `${firstName} ${lastName}`.trim() ?? "Пользователь VK"
  const cityValue = data.city
  const city = typeof cityValue === "object" && cityValue
    ? text((cityValue as Record<string, unknown>).title)
    : text(cityValue)

  return {
    vkId: String(rawId),
    name: fullName || "Пользователь VK",
    avatar: text(data.avatar) ?? text(data.photo_200) ?? text(data.picture),
    city,
    email: text(data.email) ?? fallbackEmail ?? null,
    phone: text(data.phone),
  }
}

async function profileFromVkApi(accessToken?: string, userId?: string): Promise<VkProfile | null> {
  if (!accessToken || !userId) return null

  const userRes = await fetch(
    `https://api.vk.com/method/users.get?user_ids=${encodeURIComponent(userId)}&fields=photo_200,city&access_token=${encodeURIComponent(accessToken)}&v=5.131`,
    { cache: "no-store" },
  )
  const userData = await userRes.json()
  const vkUser = userData.response?.[0]
  return profileFromObject(vkUser, userId)
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as VkPayload
    const idTokenPayload = decodeJwtPayload(body.id_token)
    const fallbackId = body.user_id !== undefined && body.user_id !== null ? String(body.user_id) : undefined
    const fallbackEmail = text(body.email)

    const profile =
      profileFromObject(body.user ?? null, fallbackId, fallbackEmail) ??
      profileFromObject(idTokenPayload, fallbackId, fallbackEmail) ??
      await profileFromVkApi(body.access_token, fallbackId)

    if (!profile) {
      return NextResponse.json({ error: "VK вернул данные без профиля" }, { status: 400 })
    }

    const session = await getSession()
    const user = await findOrCreateOAuthUser(
      {
        provider: "vk",
        providerId: profile.vkId,
        email: profile.email,
        phone: profile.phone,
        name: profile.name,
        avatar: profile.avatar,
        city: profile.city,
      },
      { preferredUserId: session?.userId },
    )

    if (user.isBanned) {
      return NextResponse.json({ error: "Аккаунт заблокирован" }, { status: 403 })
    }

    const token = await signToken({
      userId: user.id,
      phone: user.phone || "",
      role: user.role,
    })

    setAuthCookie(token)

    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        name: user.name,
        avatar: user.avatar,
        phone: user.phone,
        email: user.email,
        authProviders: {
          phone: Boolean(user.phone),
          vk: Boolean(user.vkId),
          yandex: Boolean(user.yandexId),
        },
      },
    })
  } catch (error) {
    console.error("VK token error:", error)
    return NextResponse.json({ error: "Ошибка авторизации" }, { status: 500 })
  }
}
