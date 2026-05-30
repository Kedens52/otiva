import { getVkRedirectUri } from "@/lib/app-base-url"

export { getVkRedirectUri } from "@/lib/app-base-url"

export function getVkAppId(): number | null {
  const raw =
    process.env.NEXT_PUBLIC_VK_APP_ID?.trim() ||
    process.env.VK_CLIENT_ID?.trim() ||
    process.env.NEXT_PUBLIC_VK_CLIENT_ID?.trim()
  if (!raw) return null
  const id = Number.parseInt(raw, 10)
  return Number.isFinite(id) ? id : null
}

/** Кнопка VK ID / OneTap (достаточно app id). */
export function isVkConfigured(): boolean {
  return Boolean(getVkAppId())
}

/** Серверный обмен code (нужен защищённый ключ приложения). */
export function isVkServerConfigured(): boolean {
  return Boolean(getVkAppId() && process.env.VK_CLIENT_SECRET?.trim())
}

export function getVkPublicConfig() {
  const appId = getVkAppId()
  const redirectUrl = getVkRedirectUri()

  return {
    appId,
    redirectUrl,
    enabled: Boolean(appId && redirectUrl),
  }
}
