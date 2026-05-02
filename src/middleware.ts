import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { jwtVerify } from "jose"

const ADMIN_COOKIE  = "nashlo_admin_session"
const AUTH_COOKIE   = "nashlo_token"
const PROTECTED     = ["/my-listings", "/favorites", "/chat", "/messages", "/create", "/profile/settings"]
const ADMIN_ROUTES  = ["/admin"]
const ADMIN_PUBLIC  = ["/admin/login"]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const response = NextResponse.next({ request })

  // ── Admin routes ─────────────────────────────────────────────────────────
  const ADMIN_TOKEN =
    process.env.NASHLO_ADMIN_TOKEN ||
    (process.env.NODE_ENV === "production" ? "" : "nashlo-local-developer")
  const adminSession = request.cookies.get(ADMIN_COOKIE)?.value

  if (ADMIN_PUBLIC.some((r) => pathname === r)) {
    if (ADMIN_TOKEN && adminSession === ADMIN_TOKEN)
      return NextResponse.redirect(new URL("/admin/moderation", request.url))
    return response
  }

  if (ADMIN_ROUTES.some((r) => pathname.startsWith(r))) {
    if (!ADMIN_TOKEN || adminSession !== ADMIN_TOKEN)
      return NextResponse.redirect(new URL(`/admin/login?next=${encodeURIComponent(pathname)}`, request.url))
    return response
  }

  // ── User auth for protected pages ────────────────────────────────────────
  if (PROTECTED.some((r) => pathname.startsWith(r))) {
    const token = request.cookies.get(AUTH_COOKIE)?.value

    let authenticated = false
    if (token) {
      try {
        const secret = new TextEncoder().encode(
          process.env.JWT_SECRET || "fallback-secret-change-in-production"
        )
        await jwtVerify(token, secret)
        authenticated = true
      } catch {}
    }

    if (!authenticated) {
      return NextResponse.redirect(
        new URL(`/login?from=${encodeURIComponent(pathname)}`, request.url)
      )
    }
  }

  return response
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.svg$).*)"],
}
