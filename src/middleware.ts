import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createMiddlewareSupabase } from "@/lib/supabase-server"

const ADMIN_COOKIE = "nashlo_admin_session"
const PROTECTED = ["/my-listings", "/favorites", "/chat", "/messages", "/create", "/profile/settings"]
const AUTH_ONLY = ["/login", "/register"]
const ADMIN_ROUTES = ["/admin"]
const ADMIN_PUBLIC = ["/admin/login"]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const response = NextResponse.next({ request })

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

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (supabaseUrl && supabaseKey) {
    const supabase = createMiddlewareSupabase(request, response)
    const { data: { user } } = await supabase.auth.getUser()

    if (AUTH_ONLY.some((r) => pathname.startsWith(r))) {
      if (user) return NextResponse.redirect(new URL("/", request.url))
      return response
    }

    if (PROTECTED.some((r) => pathname.startsWith(r))) {
      if (!user)
        return NextResponse.redirect(new URL(`/login?from=${encodeURIComponent(pathname)}`, request.url))
    }
  }

  return response
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.svg$).*)"],
}
