import { NextResponse } from "next/server"

const ADMIN_COOKIE = "nashlo_admin_session"
const attempts = new Map<string, { count: number; resetAt: number }>()

function adminCode() {
  if (process.env.NASHLO_ADMIN_CODE) return process.env.NASHLO_ADMIN_CODE
  if (process.env.NODE_ENV === "production") return null
  return "nashlo-dev"
}

function adminToken() {
  if (process.env.NASHLO_ADMIN_TOKEN) return process.env.NASHLO_ADMIN_TOKEN
  if (process.env.NODE_ENV === "production") return null
  return "nashlo-local-developer"
}

function clientKey(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")
  return forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "local"
}

function isLimited(key: string) {
  const now = Date.now()
  const current = attempts.get(key)
  if (!current || current.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + 10 * 60 * 1000 })
    return false
  }
  current.count += 1
  attempts.set(key, current)
  return current.count > 5
}

export async function POST(request: Request) {
  const expectedCode = adminCode()
  const token = adminToken()

  if (!expectedCode || !token) {
    return NextResponse.json({ error: "Админ-доступ не настроен" }, { status: 503 })
  }

  const key = clientKey(request)
  if (isLimited(key)) {
    return NextResponse.json({ error: "Слишком много попыток. Попробуйте позже." }, { status: 429 })
  }

  const body = await request.json().catch(() => ({}))
  const code = typeof body.code === "string" ? body.code.trim() : ""

  if (code !== expectedCode) {
    return NextResponse.json({ error: "Неверный код разработчика" }, { status: 401 })
  }

  attempts.delete(key)
  const response = NextResponse.json({ ok: true })
  response.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 2,
  })
  return response
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true })
  response.cookies.set(ADMIN_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  })
  return response
}
