import { NextRequest, NextResponse } from "next/server"
import { buildPostLoginPath } from "@/lib/auth-post-login"
import { sessionCookieOptions } from "@/lib/auth-cookies"
import { COOKIE_NAME } from "@/lib/auth"
import { exchangeVkIdCode, loginWithVkProfile } from "@/lib/vk-id-exchange"
import { isVkServerConfigured } from "@/lib/vk-id-config"
import { oauthDebug } from "@/lib/oauth-debug"

export const dynamic = "force-dynamic"

function safeNextPath(raw: unknown): string {
  const value = typeof raw === "string" ? raw.trim() : ""
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/profile"
  return value
}

/** Обмен code + device_id от VK ID OneTap (без OAuth state cookie). */
export async function POST(request: NextRequest) {
  if (!isVkServerConfigured()) {
    return NextResponse.json({ error: "VK не настроен на сервере" }, { status: 503 })
  }

  try {
    const body = (await request.json()) as { code?: string; device_id?: string; next?: string }
    const code = body.code?.trim()
    const deviceId = body.device_id?.trim()
    const nextPath = safeNextPath(body.next)

    if (!code || !deviceId) {
      return NextResponse.json({ error: "Нет кода авторизации VK" }, { status: 400 })
    }

    const { profile } = await exchangeVkIdCode(code, deviceId, request)
    const { token, user } = await loginWithVkProfile(request, profile)
    const redirectPath = buildPostLoginPath(user, nextPath)

    const response = NextResponse.json({ ok: true, redirect: redirectPath })
    response.cookies.set(COOKIE_NAME, token, sessionCookieOptions(request))
    oauthDebug("vk_exchange_ok", { nextPath })
    return response
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown"
    oauthDebug("vk_exchange_error", { message })
    const hint =
      message.includes("invalid") || message.includes("redirect")
        ? "Проверьте VK_REDIRECT_URI в .env и кабинете id.vk.com"
        : "Не удалось войти через VK"
    return NextResponse.json({ error: hint }, { status: 500 })
  }
}
