import { randomBytes } from "crypto"
import type { NextRequest, NextResponse } from "next/server"
import { isProductionHttps, type OAuthRequest } from "@/lib/app-base-url"
import { oauthProductionLog } from "@/lib/oauth-production-log"

export const OAUTH_STATE_COOKIE = "nashlo_oauth_state"
export const OAUTH_NEXT_COOKIE = "nashlo_oauth_next"
export const VK_DEVICE_COOKIE = "nashlo_vk_device_id"

const COOKIE_MAX_AGE = 60 * 10 // 10 min

function safeNextPath(raw: string | null | undefined): string {
  const value = raw?.trim()
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/profile"
  return value
}

export function createOAuthState(): string {
  return randomBytes(24).toString("hex")
}

export function oauthCookieOptions(request?: OAuthRequest) {
  return {
    httpOnly: true,
    secure: isProductionHttps(request),
    sameSite: "lax" as const,
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  }
}

export function setOAuthFlowCookies(
  response: NextResponse,
  state: string,
  nextPath: string | null | undefined,
  request?: OAuthRequest,
) {
  const opts = oauthCookieOptions(request)
  response.cookies.set(OAUTH_STATE_COOKIE, state, opts)
  response.cookies.set(OAUTH_NEXT_COOKIE, safeNextPath(nextPath), opts)
}

export function setVkDeviceCookie(
  response: NextResponse,
  deviceId: string,
  request?: OAuthRequest,
) {
  response.cookies.set(VK_DEVICE_COOKIE, deviceId, oauthCookieOptions(request))
}

export function clearOAuthFlowCookies(response: NextResponse, request?: OAuthRequest) {
  const opts = { ...oauthCookieOptions(request), maxAge: 0 }
  response.cookies.set(OAUTH_STATE_COOKIE, "", opts)
  response.cookies.set(OAUTH_NEXT_COOKIE, "", opts)
  response.cookies.set(VK_DEVICE_COOKIE, "", opts)
}

export function verifyOAuthState(request: NextRequest, stateParam: string | null): {
  ok: boolean
  nextPath: string
} {
  const expected = request.cookies.get(OAUTH_STATE_COOKIE)?.value
  const nextPath = safeNextPath(request.cookies.get(OAUTH_NEXT_COOKIE)?.value)
  oauthProductionLog("oauth_state_check", {
    queryState: Boolean(stateParam),
    cookieState: Boolean(expected),
    host: request.headers.get("host"),
    forwardedProto: request.headers.get("x-forwarded-proto"),
  })
  if (!stateParam || !expected || stateParam !== expected) {
    return { ok: false, nextPath }
  }
  return { ok: true, nextPath }
}
