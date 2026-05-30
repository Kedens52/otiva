/** Читает CSRF cookie (path=/). Если в document несколько совпадений по имени — берётся последнее (актуальный path=/). */
export function getAdminCsrfFromDocument(): string {
  if (typeof document === "undefined") return ""
  let last = ""
  for (const part of document.cookie.split(";")) {
    const t = part.trim()
    if (!t.startsWith("nashlo_admin_csrf=")) continue
    last = decodeURIComponent(t.slice("nashlo_admin_csrf=".length))
  }
  return last
}
