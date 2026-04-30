import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret-change-in-production'
)

const ADMIN_COOKIE = 'otiva_admin_session'
const ADMIN_TOKEN = process.env.OTIVA_ADMIN_TOKEN || 'otiva-local-developer'

async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as { userId: string; phone: string; role: string }
  } catch (_e) {
    return null
  }
}

const PROTECTED_ROUTES: string[] = []
const ADMIN_ROUTES = ['/admin']
const ADMIN_PUBLIC = ['/admin/login']
const AUTH_ROUTES = ['/login', '/register']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isDemoProfile = pathname.startsWith('/profile/demo')
  const token = request.cookies.get('otiva_token')?.value
  const adminSession = request.cookies.get(ADMIN_COOKIE)?.value

  let session = null
  if (token) {
    session = await verifyToken(token)
  }

  // Auth pages — redirect if already logged in
  if (AUTH_ROUTES.some((r) => pathname.startsWith(r))) {
    if (session) return NextResponse.redirect(new URL('/', request.url))
    return NextResponse.next()
  }

  // Admin login page — always accessible
  if (ADMIN_PUBLIC.some((r) => pathname === r)) {
    // If already authed as admin — redirect to panel
    if (adminSession === ADMIN_TOKEN) {
      return NextResponse.redirect(new URL('/admin/moderation', request.url))
    }
    return NextResponse.next()
  }

  // Admin routes — require admin session cookie
  if (ADMIN_ROUTES.some((r) => pathname.startsWith(r))) {
    if (adminSession !== ADMIN_TOKEN) {
      const next = encodeURIComponent(pathname)
      return NextResponse.redirect(new URL('/admin/login?next=' + next, request.url))
    }
    return NextResponse.next()
  }

  // Protected user routes
  if (!isDemoProfile && PROTECTED_ROUTES.some((r) => pathname.startsWith(r))) {
    if (!session) {
      const from = encodeURIComponent(pathname)
      return NextResponse.redirect(new URL('/login?from=' + from, request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|public).*)'],
}
