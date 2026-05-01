import { NextRequest, NextResponse } from "next/server"

const ADMIN_COOKIE = "nashlo_admin_session"

function adminToken() {
  if (process.env.NASHLO_ADMIN_TOKEN) return process.env.NASHLO_ADMIN_TOKEN
  if (process.env.NODE_ENV === "production") return null
  return "nashlo-local-developer"
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isAdminPage = pathname.startsWith("/admin")
  const isAdminApi = pathname.startsWith("/api/admin")
  const isAdminLogin = pathname === "/admin/login"
  const isAdminSessionApi = pathname === "/api/admin/session"

  if ((!isAdminPage && !isAdminApi) || isAdminLogin || isAdminSessionApi) {
    return NextResponse.next()
  }

  const token = adminToken()
  const hasAccess = Boolean(token) && request.cookies.get(ADMIN_COOKIE)?.value === token

  if (hasAccess) {
    return NextResponse.next()
  }

  if (isAdminApi) {
    return NextResponse.json({ error: "Admin access required" }, { status: 401 })
  }

  const loginUrl = request.nextUrl.clone()
  loginUrl.pathname = "/admin/login"
  loginUrl.searchParams.set("next", pathname)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
}
