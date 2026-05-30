import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

const postSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(10).max(2000),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const publicOnly = request.nextUrl.searchParams.get("public") === "1"
  const where = {
    companyId: params.id,
    ...(publicOnly ? { status: "PUBLISHED" as const } : {}),
  }

  const items = await prisma.companyReview.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      author: { select: { id: true, name: true, avatar: true } },
    },
  })

  const stats = await prisma.companyReview.aggregate({
    where: { companyId: params.id, status: "PUBLISHED" },
    _avg: { rating: true },
    _count: true,
  })

  return NextResponse.json({
    items: items.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
      author: { name: r.author.name ?? "Пользователь", avatar: r.author.avatar },
    })),
    averageRating: stats._avg.rating ?? 0,
    count: stats._count,
  })
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Войдите, чтобы оставить отзыв" }, { status: 401 })

  const company = await prisma.company.findFirst({
    where: { id: params.id, verificationStatus: "VERIFIED", isPublic: true, isBlocked: false },
    select: { id: true, ownerId: true },
  })
  if (!company) return NextResponse.json({ error: "Компания недоступна" }, { status: 404 })
  if (company.ownerId === user.id) {
    return NextResponse.json({ error: "Нельзя оставить отзыв своей компании" }, { status: 403 })
  }

  const data = postSchema.parse(await request.json())

  const review = await prisma.companyReview.upsert({
    where: { companyId_authorId: { companyId: params.id, authorId: user.id } },
    create: {
      companyId: params.id,
      authorId: user.id,
      rating: data.rating,
      comment: data.comment.trim(),
      status: "PUBLISHED",
    },
    update: {
      rating: data.rating,
      comment: data.comment.trim(),
      status: "PUBLISHED",
    },
  })

  return NextResponse.json({ review })
}
