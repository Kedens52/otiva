import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret-change-in-production'
)

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
const AUTH_ROUTES = ['/login', '/register']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isDemoProfile = pathname.startsWith('/profile/demo')
  const token = request.cookies.get('otiva_token')?.value

  let session = null
  if (token) {
    session = await verifyToken(token)
  }

  if (AUTH_ROUTES.some((r) => pathname.startsWith(r))) {
    if (session) {
      return NextResponse.redirect(new URL('/', request.url))
    }
    return NextResponse.next()
  }

  if (!isDemoProfile && PROTECTED_ROUTES.some((r) => pathname.startsWith(r))) {
    if (!session) {
      const from = encodeURIComponent(pathname)
      return NextResponse.redirect(new URL('/login?from=' + from, request.url))
    }
  }

  if (ADMIN_ROUTES.some((r) => pathname.startsWith(r))) {
    if (!session || !['ADMIN', 'MODERATOR'].includes(session.role)) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|public).*)'],
}
