import { NextRequest, NextResponse } from "next/server"
import { buildPostLoginPath } from "@/lib/auth-post-login"
import { sessionCookieOptions } from "@/lib/auth-cookies"
import { getSession, signToken, COOKIE_NAME } from "@/lib/auth"
import { findOrCreateOAuthUser } from "@/lib/oauth-users"
import { recordRegistrationVisit, recordUserLogin } from "@/lib/analytics/record-visit"
import { oauthDebug } from "@/lib/oauth-debug"

export const dynamic = "force-dynamic"

type VkPayload = {
  access_token?: string
  id_token?: string
  user_id?: number | string
  user?: Record<string, unknown>
  email?: string
  next?: string
}

type VkProfile = {
  vkId: string
  name: string
  firstName: string | null
  lastName: string | null
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

function profileFromObject(
  data: Record<string, unknown> | null,
  fallbackId?: string,
  fallbackEmail?: string | null,
): VkProfile | null {
  if (!data) return null

  const rawId = data.user_id ?? data.id ?? data.sub ?? fallbackId
  if (rawId === undefined || rawId === null || String(rawId).trim() === "") return null

  const firstName = text(data.first_name) ?? text(data.given_name) ?? ""
  const lastName = text(data.last_name) ?? text(data.family_name) ?? ""
  const fullName =
    (text(data.name) ?? `${firstName} ${lastName}`.trim()) || "Пользователь VK"
  const cityValue = data.city
  const city =
    typeof cityValue === "object" && cityValue
      ? text((cityValue as Record<string, unknown>).title)
      : text(cityValue)

  const avatar =
    text(data.avatar) ??
    text(data.photo_max) ??
    text(data.photo_200) ??
    text(data.photo_100) ??
    text(data.picture)

  return {
    vkId: String(rawId),
    name: fullName,
    firstName: firstName || null,
    lastName: lastName || null,
    avatar,
    city,
    email: text(data.email) ?? fallbackEmail ?? null,
    phone: text(data.phone),
  }
}

async function profileFromVkIdApi(accessToken: string): Promise<VkProfile | null> {
  try {
    const res = await fetch("https://id.vk.com/oauth2/user_info", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Bearer ${accessToken}`,
      },
      body: `client_id=${encodeURIComponent(process.env.VK_CLIENT_ID ?? "")}`,
      cache: "no-store",
    })
    oauthDebug("vk_id_user_info_response", {
      ok: res.ok,
      status: res.status,
      hasToken: Boolean(accessToken),
    })
    if (!res.ok) return null
    const data = (await res.json()) as Record<string, unknown>
    const uid = text(data.user_id) ?? text(data.sub)
    const inner =
      data.user && typeof data.user === "object" && !Array.isArray(data.user)
        ? (data.user as Record<string, unknown>)
        : data
    return profileFromObject(inner, uid ?? undefined, undefined)
  } catch {
    return null
  }
}

async function profileFromVkApi(accessToken: string, userId: string): Promise<VkProfile | null> {
  try {
    const res = await fetch(
      `https://api.vk.com/method/users.get?user_ids=${encodeURIComponent(userId)}&fields=photo_200,photo_100,photo_max_orig,city&access_token=${encodeURIComponent(accessToken)}&v=5.131`,
      { cache: "no-store" },
    )
    if (!res.ok) return null
    const data = await res.json()
    const vkUser = data.response?.[0]
    return profileFromObject(vkUser, userId)
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  oauthDebug("vk_token_post_start", {})
  try {
    const body = (await request.json()) as VkPayload
    const idTokenPayload = decodeJwtPayload(body.id_token)
    const fallbackId =
      body.user_id !== undefined && body.user_id !== null ? String(body.user_id) : undefined
    const fallbackEmail = text(body.email)

    oauthDebug("vk_token_payload", {
      hasAccessToken: Boolean(body.access_token),
      hasIdToken: Boolean(body.id_token),
      hasUserObject: Boolean(body.user),
      fallbackIdPresent: Boolean(fallbackId),
      emailHint: Boolean(fallbackEmail),
    })

    let profile = profileFromObject(body.user ?? null, fallbackId, fallbackEmail)

    if (!profile) profile = profileFromObject(idTokenPayload, fallbackId, fallbackEmail)

    if (!profile && body.access_token) {
      profile = await profileFromVkIdApi(body.access_token)
    }

    if (!profile && body.access_token && fallbackId) {
      profile = await profileFromVkApi(body.access_token, fallbackId)
    }

    if (!profile) {
      oauthDebug("vk_token_no_profile", {})
      return NextResponse.json({ error: "VK вернул данные без профиля" }, { status: 400 })
    }

    oauthDebug("vk_token_profile_ok", {
      providerUserId: profile.vkId,
      emailPresent: Boolean(profile.email),
      namePresent: Boolean(profile.name),
    })

    const session = await getSession()
    const { user, isNew } = await findOrCreateOAuthUser(
      {
        provider: "vk",
        providerId: profile.vkId,
        email: profile.email,
        phone: profile.phone,
        name: profile.name,
        firstName: profile.firstName,
        lastName: profile.lastName,
        avatar: profile.avatar,
        city: profile.city,
      },
      { preferredUserId: session?.userId },
    )

    oauthDebug("vk_token_user_upsert", {
      userId: user.id,
      createdOrUpdated: true,
    })

    if (user.isBanned) {
      return NextResponse.json({ error: "Аккаунт заблокирован" }, { status: 403 })
    }

    if (isNew) void recordRegistrationVisit(request, user.id, "vk")
    else void recordUserLogin(request, user.id, "vk")

    const token = await signToken({
      userId: user.id,
      phone: user.phone || "",
      role: user.role,
    })

    const redirectPath = buildPostLoginPath(
      user,
      typeof body.next === "string" ? body.next : "/profile",
    )

    const response = NextResponse.json({
      ok: true,
      redirect: redirectPath,
      user: {
        id: user.id,
        name: user.name,
        firstName: user.firstName,
        lastName: user.lastName,
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

    response.cookies.set(COOKIE_NAME, token, sessionCookieOptions(request))
    oauthDebug("vk_token_cookie_set", { redirectJson: true })
    return response
  } catch (error) {
    oauthDebug("vk_token_error", {
      message: error instanceof Error ? error.message : "unknown",
    })
    console.error("VK token error:", error)
    return NextResponse.json({ error: "Ошибка авторизации" }, { status: 500 })
  }
}
