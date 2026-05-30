import { getAdminCsrfFromDocument } from "@/lib/admin/csrf-client"
import { clearStaffAppToken, getStaffAppToken } from "@/lib/admin/staff-app-auth"

export type StaffAppFetchInit = RequestInit & {
  json?: unknown
}

/** Запросы из десктоп-приложения: Bearer без CSRF. */
export async function staffAppFetch(
  input: RequestInfo | URL,
  init: StaffAppFetchInit = {},
): Promise<Response> {
  const token = getStaffAppToken()
  const headers = new Headers(init.headers)

  if (init.json !== undefined) {
    headers.set("Content-Type", "application/json")
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`)
  }

  const res = await fetch(input, {
    ...init,
    headers,
    body: init.json !== undefined ? JSON.stringify(init.json) : init.body,
  })

  if (res.status === 401 && typeof window !== "undefined") {
    clearStaffAppToken()
    const path = window.location.pathname
    if (!path.startsWith("/admin/app/login")) {
      window.location.href = `/admin/app/login?next=${encodeURIComponent(path)}`
    }
  }

  return res
}

/** Запросы из браузерной админки (cookie + CSRF). */
export async function adminWebFetch(
  input: RequestInfo | URL,
  init: StaffAppFetchInit = {},
): Promise<Response> {
  const headers = new Headers(init.headers)
  if (init.json !== undefined) {
    headers.set("Content-Type", "application/json")
  }
  const method = (init.method ?? "GET").toUpperCase()
  if (method !== "GET" && method !== "HEAD") {
    headers.set("X-CSRF-Token", getAdminCsrfFromDocument())
  }
  return fetch(input, {
    ...init,
    headers,
    body: init.json !== undefined ? JSON.stringify(init.json) : init.body,
  })
}
