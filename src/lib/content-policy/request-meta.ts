import type { NextRequest } from "next/server"

export function getRequestMeta(request?: NextRequest | null) {
  if (!request) return { ip: null as string | null, userAgent: null as string | null }
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    null
  const userAgent = request.headers.get("user-agent")
  return { ip, userAgent }
}
