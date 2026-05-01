import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

const ADMIN_COOKIE = "nashlo_admin_session"

function adminToken() {
  if (process.env.NASHLO_ADMIN_TOKEN) return process.env.NASHLO_ADMIN_TOKEN
  if (process.env.NODE_ENV === "production") return null
  return "nashlo-local-developer"
}

function isAuthed(request: NextRequest) {
  const cookieStore = cookies()
  const token = cookieStore.get(ADMIN_COOKIE)?.value
  const expected = adminToken()
  return expected && token === expected
}

// In-memory moderation state (resets on server restart — fine for demo)
const moderationState = new Map<string, "PENDING" | "APPROVED" | "REJECTED">()

export async function GET(request: NextRequest) {
  if (!isAuthed(request)) return NextResponse.json({ error: "Нет доступа" }, { status: 403 })
  // Return empty — admin pages use mock data directly on client
  return NextResponse.json({ ok: true, items: [], total: 0 })
}

export async function POST(request: NextRequest) {
  if (!isAuthed(request)) return NextResponse.json({ error: "Нет доступа" }, { status: 403 })
  try {
    const body = await request.json()
    const { listingId, action } = body
    if (!listingId || !["APPROVED", "REJECTED"].includes(action)) {
      return NextResponse.json({ error: "Неверные данные" }, { status: 400 })
    }
    moderationState.set(listingId, action)
    return NextResponse.json({ ok: true, listingId, action })
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}
