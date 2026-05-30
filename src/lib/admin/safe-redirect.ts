/**
 * Разрешён только внутренний путь (без open redirect на внешний URL).
 */
export function safeAdminRedirectPath(raw: string | null | undefined, fallback = "/admin/dashboard"): string {
  if (!raw || typeof raw !== "string") return fallback
  const t = raw.trim()
  if (!t.startsWith("/")) return fallback
  if (t.startsWith("//")) return fallback
  if (/^\/\w+:\/\//i.test(t)) return fallback
  return t
}
