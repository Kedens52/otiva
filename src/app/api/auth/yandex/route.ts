import { NextRequest, NextResponse } from "next/server"
import { getOAuthBaseUrl, getYandexRedirectUri } from "@/lib/app-base-url"
import { oauthProductionLog } from "@/lib/oauth-production-log"
import { createOAuthState, setOAuthFlowCookies } from "@/lib/oauth-state"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const clientId = process.env.YANDEX_CLIENT_ID?.trim()
  const clientSecret = process.env.YANDEX_CLIENT_SECRET?.trim()
  const baseUrl = getOAuthBaseUrl(request)
  const redirectUri = getYandexRedirectUri(request)
  const next = request.nextUrl.searchParams.get("next")

  oauthProductionLog("yandex_start", {
    redirectUri,
    returnTo: next,
    siteUrl: process.env.SITE_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? null,
    host: request.headers.get("host"),
    forwardedProto: request.headers.get("x-forwarded-proto"),
  })
  const scope =
    process.env.YANDEX_OAUTH_SCOPE?.trim() || "login:email login:info login:avatar"

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${baseUrl}/login?error=yandex_error`)
  }

  const state = createOAuthState()
  const url = new URL("https://oauth.yandex.ru/authorize")
  url.searchParams.set("response_type", "code")
  url.searchParams.set("client_id", clientId)
  url.searchParams.set("redirect_uri", redirectUri)
  url.searchParams.set("state", state)
  url.searchParams.set("scope", scope)

  const response = NextResponse.redirect(url.toString())
  setOAuthFlowCookies(response, state, next, request)
  return response
}
