import { NextResponse } from "next/server"

const ADMIN_COOKIE = "otiva_admin_session"

function adminCode() {
  return process.env.OTIVA_ADMIN_CODE || "otiva-dev"
}

function adminToken() {
  return process.env.OTIVA_ADMIN_TOKEN || "otiva-local-developer"
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const code = typeof body.code === "string" ? body.code.trim() : ""

  if (code !== adminCode()) {
    return NextResponse.json({ error: "Неверный код разработчика" }, { status: 401 })
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set(ADMIN_COOKIE, adminToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
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
