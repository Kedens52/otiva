import { NextRequest, NextResponse } from "next/server"
import { getSession, signToken, COOKIE_NAME, COOKIE_OPTIONS } from "@/lib/auth"
import { findOrCreateOAuthUser, RegistrationRateLimitError } from "@/lib/oauth-users"
import { checkNewRegistrationIpLimit, getClientIp } from "@/lib/auth-rate-limit"
import { recordRegistrationVisit, recordUserLogin } from "@/lib/analytics/record-visit"
import { buildPostLoginPath } from "@/lib/auth-post-login"
import { getOAuthBaseUrl, getYandexRedirectUri } from "@/lib/app-base-url"
import { oauthProductionLog } from "@/lib/oauth-production-log"
import { clearOAuthFlowCookies, verifyOAuthState } from "@/lib/oauth-state"
import { oauthDebug } from "@/lib/oauth-debug"
import { recalculateUserTrust } from "@/lib/user-trust-engine"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

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

function splitRealName(real?: string | null): { firstName: string | null; lastName: string | null } {
  const t = real?.trim()
  if (!t) return { firstName: null, lastName: null }
  const parts = t.split(/\s+/)
  if (parts.length === 1) return { firstName: parts[0], lastName: null }
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") || null }
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const code = searchParams.get("code")
  const stateParam = searchParams.get("state")
  const oauthError = searchParams.get("error")
  const baseUrl = getOAuthBaseUrl(request)
  const { ok: stateOk, nextPath } = verifyOAuthState(request, stateParam)

  oauthDebug("yandex_callback_start", {
    hasCode: Boolean(code),
    stateOk,
    baseHost: new URL(baseUrl).host,
  })

  if (!stateOk) {
    const response = NextResponse.redirect(`${baseUrl}/login?error=yandex_state`)
    clearOAuthFlowCookies(response, request)
    return response
  }

  if (oauthError || !code) {
    oauthDebug("yandex_callback_oauth_error", { oauthError })
    const response = NextResponse.redirect(`${baseUrl}/login?error=yandex_denied`)
    clearOAuthFlowCookies(response, request)
    return response
  }

  try {
    const clientId = process.env.YANDEX_CLIENT_ID?.trim()
    const clientSecret = process.env.YANDEX_CLIENT_SECRET?.trim()

    if (!clientId || !clientSecret) {
      const response = NextResponse.redirect(`${baseUrl}/login?error=yandex_error`)
      clearOAuthFlowCookies(response, request)
      return response
    }

    const redirectUri = getYandexRedirectUri(request)
    oauthProductionLog("yandex_token_redirect_uri", { redirectUri })
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

    oauthDebug("yandex_token_exchange", {
      ok: !tokenData.error && Boolean(tokenData.access_token),
      errorHint: tokenData.error ? String(tokenData.error) : undefined,
    })

    if (tokenData.error || !tokenData.access_token) {
      console.error("Yandex token error:", tokenData.error, tokenData.error_description)
      const response = NextResponse.redirect(`${baseUrl}/login?error=yandex_token`)
      clearOAuthFlowCookies(response, request)
      return response
    }

    const userRes = await fetch("https://login.yandex.ru/info?format=json", {
      headers: { Authorization: `OAuth ${tokenData.access_token}` },
      cache: "no-store",
    })
    const yandexUser = (await userRes.json()) as YandexUser

    oauthDebug("yandex_profile", {
      hasId: Boolean(yandexUser.id),
      emailPresent: Boolean(yandexUser.default_email),
    })

    if (!yandexUser.id) {
      return NextResponse.redirect(`${baseUrl}/login?error=yandex_user`)
    }

    const avatar = yandexUser.default_avatar_id
      ? `https://avatars.yandex.net/get-yapic/${yandexUser.default_avatar_id}/islands-200`
      : null
    const phone = yandexUser.default_phone?.number || yandexUser.phones?.[0]?.number || null

    const fromReal = splitRealName(yandexUser.real_name)
    const displayName =
      yandexUser.real_name?.trim() ||
      yandexUser.display_name?.trim() ||
      yandexUser.login?.trim() ||
      "Пользователь Яндекса"

    const session = await getSession()
    const clientIp = getClientIp(request)

    let user: Awaited<ReturnType<typeof findOrCreateOAuthUser>>["user"]
    let isNew: boolean
    try {
      const result = await findOrCreateOAuthUser(
        {
          provider: "yandex",
          providerId: String(yandexUser.id),
          email: yandexUser.default_email || null,
          phone,
          name: displayName,
          firstName: fromReal.firstName,
          lastName: fromReal.lastName,
          avatar,
        },
        {
          preferredUserId: session?.userId,
          assertCanRegister: async () => {
            if (!(await checkNewRegistrationIpLimit(request))) {
              throw new RegistrationRateLimitError()
            }
          },
        },
      )
      user = result.user
      isNew = result.isNew
    } catch (error) {
      if (error instanceof RegistrationRateLimitError) {
        const response = NextResponse.redirect(`${baseUrl}/login?error=rate_limit`)
        clearOAuthFlowCookies(response, request)
        return response
      }
      throw error
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date(), lastLoginIp: clientIp },
    })

    oauthDebug("yandex_user_ready", {
      userId: user.id,
      emailPresent: Boolean(user.email),
      yandexLinked: Boolean(user.yandexId),
    })

    if (user.isBanned) {
      return NextResponse.redirect(`${baseUrl}/login?error=banned`)
    }

    if (isNew) {
      void recordRegistrationVisit(request, user.id, "yandex")
      const { tryWelcomeBonus } = await import("@/lib/bonuses/hooks")
      void tryWelcomeBonus(user.id, prisma).catch(() => {})
    } else {
      void recordUserLogin(request, user.id, "yandex")
    }
    void recalculateUserTrust(user.id).catch(() => {})

    const token = await signToken({
      userId: user.id,
      phone: user.phone || "",
      role: user.role,
    })

    const redirectPath = buildPostLoginPath(user, nextPath)
    const response = NextResponse.redirect(`${baseUrl}${redirectPath}`)
    response.cookies.set(COOKIE_NAME, token, COOKIE_OPTIONS)
    clearOAuthFlowCookies(response, request)
    oauthDebug("yandex_redirect", { path: redirectPath, isNew })
    return response
  } catch (error) {
    oauthDebug("yandex_callback_exception", {
      message: error instanceof Error ? error.message : "unknown",
    })
    console.error("Yandex OAuth error:", error)
    const baseUrl = getOAuthBaseUrl(request)
    const response = NextResponse.redirect(`${baseUrl}/login?error=yandex_error`)
    clearOAuthFlowCookies(response, request)
    return response
  }
}
