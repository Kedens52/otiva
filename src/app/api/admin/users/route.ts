import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

const ADMIN_COOKIE = "nashlo_admin_session"

function adminToken() {
  if (process.env.NASHLO_ADMIN_TOKEN) return process.env.NASHLO_ADMIN_TOKEN
  if (process.env.NODE_ENV === "production") return null
  return "nashlo-local-developer"
}

function isAuthed() {
  const cookieStore = cookies()
  const token = cookieStore.get(ADMIN_COOKIE)?.value
  const expected = adminToken()
  return expected && token === expected
}

const banState = new Map<string, boolean>()

export async function GET() {
  if (!isAuthed()) return NextResponse.json({ error: "Нет доступа" }, { status: 403 })
  return NextResponse.json({ ok: true, items: [], total: 0 })
}

export async function PATCH(request: NextRequest) {
  if (!isAuthed()) return NextResponse.json({ error: "Нет доступа" }, { status: 403 })
  try {
    const body = await request.json()
    const { userId, isBanned } = body
    if (!userId || typeof isBanned !== "boolean") {
      return NextResponse.json({ error: "Неверные данные" }, { status: 400 })
    }
    banState.set(userId, isBanned)
    return NextResponse.json({ ok: true, userId, isBanned })
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}
