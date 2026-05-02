import { NextRequest, NextResponse } from "next/server"
import { getSession, signToken, COOKIE_NAME, COOKIE_OPTIONS } from "@/lib/auth"
import { findOrCreateOAuthUser } from "@/lib/oauth-users"

type YandexPhone = {
  number?: string
}

type YandexUser = {
  id?: string | number
  login?: string
  real_name?: string
  display_name?: string
  default_email?: string
  default_avatar_id?: string
  default_phone?: YandexPhone
  phones?: YandexPhone[]
}

function safeNext(value: string | null) {
  return value?.startsWith("/") ? value : "/profile"
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const code = searchParams.get("code")
  const next = safeNext(searchParams.get("state"))
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://nashlo.ru"

  if (!code) {
    return NextResponse.redirect(`${baseUrl}/login?error=yandex_denied`)
  }

  try {
    const clientId = process.env.YANDEX_CLIENT_ID
    const clientSecret = process.env.YANDEX_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(`${baseUrl}/login?error=yandex_error`)
    }

    const redirectUri = `${baseUrl}/api/auth/yandex/callback`
    const tokenRes = await fetch("https://oauth.yandex.ru/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
      }),
      cache: "no-store",
    })

    const tokenData = await tokenRes.json()

    if (tokenData.error || !tokenData.access_token) {
      console.error("Yandex token error:", tokenData)
      return NextResponse.redirect(`${baseUrl}/login?error=yandex_token`)
    }

    const userRes = await fetch("https://login.yandex.ru/info?format=json", {
      headers: { Authorization: `OAuth ${tokenData.access_token}` },
      cache: "no-store",
    })
    const yandexUser = (await userRes.json()) as YandexUser

    if (!yandexUser.id) {
      return NextResponse.redirect(`${baseUrl}/login?error=yandex_user`)
    }

    const avatar = yandexUser.default_avatar_id
      ? `https://avatars.yandex.net/get-yapic/${yandexUser.default_avatar_id}/islands-200`
      : null
    const phone = yandexUser.default_phone?.number || yandexUser.phones?.[0]?.number || null

    const session = await getSession()
    const user = await findOrCreateOAuthUser(
      {
        provider: "yandex",
        providerId: String(yandexUser.id),
        email: yandexUser.default_email || null,
        phone,
        name: yandexUser.real_name || yandexUser.display_name || yandexUser.login || "Пользователь Яндекса",
        avatar,
      },
      { preferredUserId: session?.userId },
    )

    if (user.isBanned) {
      return NextResponse.redirect(`${baseUrl}/login?error=banned`)
    }

    const token = await signToken({
      userId: user.id,
      phone: user.phone || "",
      role: user.role,
    })

    const response = NextResponse.redirect(`${baseUrl}${next}`)
    response.cookies.set(COOKIE_NAME, token, COOKIE_OPTIONS)
    return response
  } catch (error) {
    console.error("Yandex OAuth error:", error)
    return NextResponse.redirect(`${baseUrl}/login?error=yandex_error`)
  }
}
