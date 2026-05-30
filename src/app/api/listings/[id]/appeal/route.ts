import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

const bodySchema = z.object({
  message: z.string().trim().min(10).max(2000),
})

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 })

    const listing = await prisma.listing.findUnique({
      where: { id: params.id },
      select: { id: true, sellerId: true, title: true },
    })
    if (!listing) return NextResponse.json({ error: "Не найдено" }, { status: 404 })
    if (listing.sellerId !== user.id) {
      return NextResponse.json({ error: "Только владелец может оспорить" }, { status: 403 })
    }

    const { message } = bodySchema.parse(await request.json())

    await prisma.report.create({
      data: {
        listingId: listing.id,
        reason: "appeal_moderation",
        reportCategory: "appeal",
        comment: message,
      },
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors[0]?.message ?? "Неверные данные" }, { status: 400 })
    }
    console.error("appeal POST", e)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}
