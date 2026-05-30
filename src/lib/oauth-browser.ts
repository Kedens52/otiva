/** Origin для VK ID SDK в браузере (localhost vs production). */
export function getBrowserOAuthOrigin(): string {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin
  }
  return (
    process.env.SITE_URL?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    process.env.APP_URL?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    (process.env.NODE_ENV === "production" ? "https://nashlo.ru" : "http://localhost:3000")
  )
}

/** Redirect URI для VK ID SDK — в кабинете VK зарегистрирован https://nashlo.ru/... */
export function getVkIdRedirectUrl(): string {
  const configured =
    process.env.NEXT_PUBLIC_VK_REDIRECT_URI?.trim() ||
    process.env.VK_REDIRECT_URI?.trim()
  if (configured) return configured

  if (typeof window !== "undefined") {
    const host = window.location.hostname
    if (host === "nashlo.ru" || host === "www.nashlo.ru") {
      return "https://nashlo.ru/api/auth/vk/callback"
    }
  }

  if (process.env.NODE_ENV === "production") {
    return "https://nashlo.ru/api/auth/vk/callback"
  }

  return `${getBrowserOAuthOrigin()}/api/auth/vk/callback`
}
