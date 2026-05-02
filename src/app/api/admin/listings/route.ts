import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"

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

export async function GET(request: NextRequest) {
  if (!isAuthed(request)) return NextResponse.json({ error: "Нет доступа" }, { status: 403 })

  try {
    const { searchParams } = request.nextUrl
    const status = (searchParams.get("status") || "MODERATION") as "MODERATION" | "ACTIVE" | "REJECTED" | "ARCHIVED" | "SOLD"
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
    const take = 50

    const [items, total] = await Promise.all([
      prisma.listing.findMany({
        where: { status },
        include: {
          seller: { select: { id: true, name: true, phone: true, city: true } },
          category: { select: { slug: true, nameRu: true } },
        },
        orderBy: { createdAt: "asc" },
        skip: (page - 1) * take,
        take,
      }),
      prisma.listing.count({ where: { status } }),
    ])

    return NextResponse.json({ ok: true, items, total, page })
  } catch (error) {
    console.error("admin listings GET error:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  if (!isAuthed(request)) return NextResponse.json({ error: "Нет доступа" }, { status: 403 })

  try {
    const body = await request.json()
    const { listingId, action } = body

    if (!listingId || !["APPROVED", "REJECTED"].includes(action)) {
      return NextResponse.json({ error: "Неверные данные" }, { status: 400 })
    }

    const newStatus = action === "APPROVED" ? "ACTIVE" : "REJECTED"
    await prisma.listing.update({
      where: { id: listingId },
      data: { status: newStatus },
    })

    return NextResponse.json({ ok: true, listingId, action, newStatus })
  } catch (error) {
    console.error("admin listings POST error:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}
