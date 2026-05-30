/** Токен десктоп-приложения сотрудников (localStorage). */
export const STAFF_APP_TOKEN_KEY = "nashlo_staff_access_token"

export function getStaffAppToken(): string | null {
  if (typeof window === "undefined") return null
  const token = localStorage.getItem(STAFF_APP_TOKEN_KEY)?.trim()
  return token && token.length >= 32 ? token : null
}

export function setStaffAppToken(token: string | null): void {
  if (typeof window === "undefined") return
  if (!token) {
    localStorage.removeItem(STAFF_APP_TOKEN_KEY)
    return
  }
  localStorage.setItem(STAFF_APP_TOKEN_KEY, token)
}

export function clearStaffAppToken(): void {
  setStaffAppToken(null)
}
