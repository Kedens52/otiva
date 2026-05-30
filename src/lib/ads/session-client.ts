export const AD_SESSION_COOKIE = "nashlo-ad-session"

export function getClientAdSessionId(): string {
  if (typeof window === "undefined") return "ssr"
  const key = AD_SESSION_COOKIE
  let id = window.localStorage.getItem(key)
  if (!id) {
    id = crypto.randomUUID()
    window.localStorage.setItem(key, id)
  }
  return id
}
