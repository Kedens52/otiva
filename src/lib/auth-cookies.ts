import type { NextRequest } from "next/server"
import { COOKIE_OPTIONS } from "@/lib/auth"
import { isProductionHttps } from "@/lib/app-base-url"

export function sessionCookieOptions(request?: NextRequest | { headers: Headers }) {
  const headers = request && "headers" in request ? request.headers : undefined
  return {
    ...COOKIE_OPTIONS,
    secure: isProductionHttps(headers ? { headers } : undefined),
  }
}
