import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"

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

export async function GET(request: NextRequest) {
  if (!isAuthed()) return NextResponse.json({ error: "Нет доступа" }, { status: 403 })

  try {
    const { searchParams } = request.nextUrl
    const q    = searchParams.get("q") || ""
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
    const take = 50

    const where = q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { phone: { contains: q } },
            { city: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          phone: true,
          city: true,
          rating: true,
          isVerified: true,
          isBanned: true,
          role: true,
          createdAt: true,
          _count: { select: { listings: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * take,
        take,
      }),
      prisma.user.count({ where }),
    ])

    return NextResponse.json({ ok: true, items, total, page })
  } catch (error) {
    console.error("admin users GET error:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  if (!isAuthed()) return NextResponse.json({ error: "Нет доступа" }, { status: 403 })

  try {
    const body = await request.json()
    const { userId, isBanned } = body

    if (!userId || typeof isBanned !== "boolean") {
      return NextResponse.json({ error: "Неверные данные" }, { status: 400 })
    }

    await prisma.user.update({
      where: { id: userId },
      data: { isBanned },
    })

    return NextResponse.json({ ok: true, userId, isBanned })
  } catch (error) {
    console.error("admin users PATCH error:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}
