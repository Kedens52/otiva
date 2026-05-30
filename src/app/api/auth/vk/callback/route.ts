import { NextRequest, NextResponse } from "next/server"
import { sessionCookieOptions } from "@/lib/auth-cookies"
import { COOKIE_NAME } from "@/lib/auth"
import { buildPostLoginPath } from "@/lib/auth-post-login"
import { getOAuthBaseUrl } from "@/lib/app-base-url"
import { oauthProductionLog } from "@/lib/oauth-production-log"
import {
  clearOAuthFlowCookies,
  VK_DEVICE_COOKIE,
  verifyOAuthState,
} from "@/lib/oauth-state"
import { exchangeVkIdCode, loginWithVkProfile } from "@/lib/vk-id-exchange"
import { oauthDebug } from "@/lib/oauth-debug"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const code = searchParams.get("code")
  const deviceId =
    searchParams.get("device_id")?.trim() ||
    request.cookies.get(VK_DEVICE_COOKIE)?.value?.trim() ||
    null
  const stateParam = searchParams.get("state")
  const baseUrl = getOAuthBaseUrl(request)

  const widgetStyleCallback = Boolean(deviceId) && !stateParam
  const { ok: stateOk, nextPath } = widgetStyleCallback
    ? {
        ok: Boolean(code),
        nextPath: (() => {
          const next = searchParams.get("next")
          if (next && next.startsWith("/") && !next.startsWith("//")) return next
          return "/profile"
        })(),
      }
    : verifyOAuthState(request, stateParam)

  oauthDebug("vk_callback_start", {
    hasCode: Boolean(code),
    hasDeviceId: Boolean(deviceId),
    stateOk,
    widgetStyleCallback,
    baseHost: new URL(baseUrl).host,
  })

  if (!stateOk) {
    const response = NextResponse.redirect(`${baseUrl}/login?error=vk_state`)
    clearOAuthFlowCookies(response, request)
    return response
  }

  if (!code) {
    const response = NextResponse.redirect(`${baseUrl}/login?error=vk_denied`)
    clearOAuthFlowCookies(response, request)
    return response
  }

  if (!deviceId) {
    oauthProductionLog("vk_callback_no_device_id", {})
    const response = NextResponse.redirect(`${baseUrl}/login?error=vk_token`)
    clearOAuthFlowCookies(response, request)
    return response
  }

  try {
    const { profile } = await exchangeVkIdCode(code, deviceId, request)
    const { token, user } = await loginWithVkProfile(request, profile)
    const redirectPath = buildPostLoginPath(user, nextPath)
    const response = NextResponse.redirect(`${baseUrl}${redirectPath}`)
    response.cookies.set(COOKIE_NAME, token, sessionCookieOptions(request))
    clearOAuthFlowCookies(response, request)
    oauthDebug("vk_callback_vkid_redirect", { path: nextPath })
    return response
  } catch (error) {
    oauthDebug("vk_callback_exception", {
      message: error instanceof Error ? error.message : "unknown",
    })
    console.error("VK OAuth error:", error)
    const response = NextResponse.redirect(`${baseUrl}/login?error=vk_error`)
    clearOAuthFlowCookies(response, request)
    return response
  }
}
