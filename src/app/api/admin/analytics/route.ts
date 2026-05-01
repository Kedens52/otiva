import { NextResponse } from "next/server"
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

export async function GET() {
  if (!isAuthed()) return NextResponse.json({ error: "Нет доступа" }, { status: 403 })
  return NextResponse.json({
    users: { total: 12847, newLast30Days: 214 },
    listings: { total: 1204, active: 1118, pendingModeration: 86, sold: 342 },
    messages: { total: 94200, last7Days: 3481 },
    byCategory: [
      { category: "Автомобили",   count: 342 },
      { category: "Электроника",  count: 289 },
      { category: "Недвижимость", count: 198 },
      { category: "Услуги",       count: 156 },
      { category: "Одежда",       count: 134 },
      { category: "Остальные",    count: 85  },
    ],
    byCity: [
      { city: "Москва",          count: 421 },
      { city: "Санкт-Петербург", count: 287 },
      { city: "Казань",          count: 134 },
      { city: "Краснодар",       count: 98  },
    ],
  })
}
