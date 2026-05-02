import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const page     = Math.max(1, parseInt(searchParams.get("page") || "1"))
    const pageSize = Math.min(50, parseInt(searchParams.get("pageSize") || "20"))
    const city     = searchParams.get("city")
    const query    = searchParams.get("q")
    const priceMin = searchParams.get("priceMin") ? parseInt(searchParams.get("priceMin")!) : undefined
    const priceMax = searchParams.get("priceMax") ? parseInt(searchParams.get("priceMax")!) : undefined

    const where: Record<string, unknown> = {
      status: "ACTIVE",
      category: { slug: "cars" },
    }
    if (city)   where.city = city
    if (query)  where.OR = [
      { title: { contains: query, mode: "insensitive" } },
      { description: { contains: query, mode: "insensitive" } },
    ]
    if (priceMin !== undefined || priceMax !== undefined) {
      const priceFilter: Record<string, number> = {}
      if (priceMin !== undefined) priceFilter.gte = priceMin
      if (priceMax !== undefined) priceFilter.lte = priceMax
      where.price = priceFilter
    }

    const [items, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        include: {
          seller: { select: { id: true, name: true, avatar: true, rating: true, isVerified: true } },
          category: true,
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.listing.count({ where }),
    ])

    return NextResponse.json({ items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) })
  } catch (error) {
    console.error("cars GET error:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}
