import { randomUUID } from "crypto"
import { NextRequest, NextResponse } from "next/server"
import { getOAuthBaseUrl, getVkRedirectUri } from "@/lib/app-base-url"
import { oauthProductionLog } from "@/lib/oauth-production-log"
import { createOAuthState, setOAuthFlowCookies, setVkDeviceCookie } from "@/lib/oauth-state"

export const dynamic = "force-dynamic"

/** VK ID (id.vk.com), не legacy oauth.vk.com — иначе Security Error. */
export async function GET(request: NextRequest) {
  const clientId = process.env.VK_CLIENT_ID?.trim()
  const clientSecret = process.env.VK_CLIENT_SECRET?.trim()
  const baseUrl = getOAuthBaseUrl(request)
  const redirectUri = getVkRedirectUri(request)
  const next = request.nextUrl.searchParams.get("next")

  oauthProductionLog("vk_start", {
    redirectUri,
    returnTo: next,
    authorizeHost: "id.vk.com",
    host: request.headers.get("host"),
    forwardedProto: request.headers.get("x-forwarded-proto"),
  })

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${baseUrl}/login?error=vk_error`)
  }

  const state = createOAuthState()
  const deviceId = randomUUID()
  const scope = process.env.VK_OAUTH_SCOPE?.trim() ?? ""

  const url = new URL("https://id.vk.com/authorize")
  url.searchParams.set("response_type", "code")
  url.searchParams.set("client_id", clientId)
  url.searchParams.set("redirect_uri", redirectUri)
  url.searchParams.set("state", state)
  if (scope) url.searchParams.set("scope", scope)

  const response = NextResponse.redirect(url.toString())
  setOAuthFlowCookies(response, state, next, request)
  setVkDeviceCookie(response, deviceId, request)
  return response
}
