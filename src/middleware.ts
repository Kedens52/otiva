import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { jwtVerify } from "jose"
import {
  isSeoTechnicalPath,
  isSeoTechnicalTrailingSlash,
} from "@/lib/seo/technical-paths"
import { robotsTxtBody } from "@/lib/seo/robots-txt"
import { mergeContentSecurityPolicy } from "@/lib/tbank-csp"

const ADMIN_SESSION_COOKIE = "nashlo_admin_session"
const AUTH_COOKIE          = "nashlo_token"

/** Минимальная длина токена сессии (base64url от 32 байт ≈ 43 символа). */
const ADMIN_SESSION_MIN_LEN = 32

function hasValidAdminSession(request: NextRequest): boolean {
  const v = request.cookies.get(ADMIN_SESSION_COOKIE)?.value
  if (v && v.length >= ADMIN_SESSION_MIN_LEN) return true
  const auth = request.headers.get("authorization")
  if (auth?.startsWith("Bearer ")) {
    const token = auth.slice(7).trim()
    return token.length >= ADMIN_SESSION_MIN_LEN
  }
  return false
}

// Публичные admin-маршруты (не требуют cookie)
const ADMIN_PUBLIC_PATHS = [
  "/admin/login",
  "/admin/app/login",
  "/api/admin/auth/login",
  "/api/admin/auth/app/login",
]

// Личный кабинет и обычные защищённые страницы → /login
const USER_PROTECTED = [
  "/my-listings",
  "/favorites",
  "/chat",
  "/messages",
  "/create",
  "/profile/settings",
  "/profile/listings",
  "/profile/ads",
  "/profile/finance",
  "/profile/security",
  "/profile/bonuses",
  "/profile/want-to-buy",
  "/profile/my-offers",
]

// Бизнес-зона (auth общий, редирект в business login)
const BUSINESS_AUTH_REQUIRED = [
  "/business/dashboard",
  "/business/create",
  "/business/register",
  "/business/requests/create",
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // OAuth и session API — не трогать (редиректы, cookies, callbacks)
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next()
  }

  // Канонический домен для cookies/state: https://nashlo.ru (без www)
  const host = request.headers.get("host")?.split(",")[0]?.trim() ?? ""
  if (host.startsWith("www.")) {
    const url = request.nextUrl.clone()
    url.hostname = host.replace(/^www\./, "")
    url.protocol = "https:"
    return NextResponse.redirect(url, 308)
  }

  // SEO/технические файлы: без auth, без 308 на trailing slash (важно для Яндекс.Вебмастера)
  if (isSeoTechnicalTrailingSlash(pathname)) {
    if (pathname === "/robots.txt/") {
      return new NextResponse(robotsTxtBody(), {
        status: 200,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "public, max-age=3600",
        },
      })
    }
    const url = request.nextUrl.clone()
    url.pathname = pathname.replace(/\/$/, "")
    return NextResponse.rewrite(url)
  }

  if (isSeoTechnicalPath(pathname)) {
    return NextResponse.next()
  }

  const response = NextResponse.next()

  // ── Admin routes ──────────────────────────────────────────────────────────

  const isAdminPublic = ADMIN_PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  )

  const isAdminPage = pathname.startsWith("/admin")
  const isAdminApi  = pathname.startsWith("/api/admin")
  const isStaffAppShell =
    pathname.startsWith("/admin/app") && !pathname.startsWith("/admin/app/login")

  if (isAdminPage || isAdminApi) {
    // Публичные admin-маршруты — пропускаем без проверки
    if (isAdminPublic) {
      return addSecurityHeaders(response, true)
    }

    // Мобильное приложение: авторизация на клиенте (Bearer в localStorage)
    if (isStaffAppShell) {
      return addSecurityHeaders(response, true)
    }

    // Проверяем cookie или Authorization: Bearer (без БД — Edge ограничения).
    const hasSession = hasValidAdminSession(request)

    if (!hasSession) {
      if (isAdminApi) {
        return NextResponse.json(
          { error: "Не авторизован" },
          { status: 401 },
        )
      }
      const loginUrl = new URL("/admin/login", request.url)
      loginUrl.searchParams.set("next", pathname)
      return NextResponse.redirect(loginUrl)
    }

    if (isAdminPage) dropLegacyAdminCsrfCookie(response)

    return addSecurityHeaders(response, true)
  }

  // ── User auth for protected pages ─────────────────────────────────────────

  const needsAuth =
    USER_PROTECTED.some((r) => pathname.startsWith(r)) ||
    BUSINESS_AUTH_REQUIRED.some((r) => pathname.startsWith(r))

  if (needsAuth) {
    const token = request.cookies.get(AUTH_COOKIE)?.value
    const isBusiness = BUSINESS_AUTH_REQUIRED.some((r) => pathname.startsWith(r))
    const loginPath = isBusiness ? "/business/login" : "/login"

    let authenticated = false
    if (token) {
      try {
        const jwtSecret = process.env.JWT_SECRET
        if (!jwtSecret) {
          return NextResponse.redirect(
            new URL(`${loginPath}?from=${encodeURIComponent(pathname)}`, request.url),
          )
        }
        const secret = new TextEncoder().encode(jwtSecret)
        await jwtVerify(token, secret)
        authenticated = true
      } catch {
        // токен невалиден или истёк
      }
    }

    if (!authenticated) {
      return NextResponse.redirect(
        new URL(`${loginPath}?from=${encodeURIComponent(pathname)}`, request.url),
      )
    }
  }

  return addTbankCsp(response)
}

function addTbankCsp(res: NextResponse): NextResponse {
  const existing = res.headers.get("Content-Security-Policy")
  res.headers.set("Content-Security-Policy", mergeContentSecurityPolicy(existing))
  return res
}

function addSecurityHeaders(res: NextResponse, isAdmin: boolean): NextResponse {
  res.headers.set("X-Content-Type-Options", "nosniff")
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(self)")

  if (isAdmin) {
    res.headers.set("X-Frame-Options", "DENY")
    res.headers.set("Cache-Control", "no-store, private")
  }

  return addTbankCsp(res)
}

/** Сброс устаревшей CSRF с path=/admin — только через ответ middleware (не cookies() в RSC). */
function dropLegacyAdminCsrfCookie(res: NextResponse) {
  const isProd = process.env.NODE_ENV === "production"
  res.cookies.set({
    name:     "nashlo_admin_csrf",
    value:    "",
    path:     "/admin",
    maxAge:   0,
    sameSite: "strict",
    secure:   isProd,
    httpOnly: false,
  })
}

export const config = {
  matcher: [
    "/robots.txt/",
    "/favicon.ico/",
    "/sitemap.xml/",
    "/sitemap-static.xml/",
    "/sitemap-categories.xml/",
    "/sitemap-cities.xml/",
    "/sitemap-listings.xml/",
    "/sitemap-sellers.xml/",
    "/sitemap-business.xml/",
    "/admin/:path*",
    "/api/admin/:path*",
    "/my-listings/:path*",
    "/favorites/:path*",
    "/chat/:path*",
    "/messages/:path*",
    "/create/:path*",
    "/profile/settings/:path*",
    "/profile/listings/:path*",
    "/profile/ads/:path*",
    "/profile/finance",
    "/profile/finance/:path*",
    "/profile/security/:path*",
    "/profile/bonuses/:path*",
    "/business/dashboard/:path*",
    "/business/create/:path*",
    "/business/register/:path*",
    "/business/requests/create/:path*",
  ],
}
