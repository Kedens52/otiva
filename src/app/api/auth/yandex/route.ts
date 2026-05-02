import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const clientId = process.env.YANDEX_CLIENT_ID
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://nashlo.ru"
  const redirectUri = `${baseUrl}/api/auth/yandex/callback`
  const next = new URL(request.url).searchParams.get("next") || "/profile"

  if (!clientId) {
    return NextResponse.redirect(`${baseUrl}/login?error=yandex_error`)
  }

  const url = new URL("https://oauth.yandex.ru/authorize")
  url.searchParams.set("response_type", "code")
  url.searchParams.set("client_id", clientId)
  url.searchParams.set("redirect_uri", redirectUri)
  url.searchParams.set("state", next)

  return NextResponse.redirect(url.toString())
}
