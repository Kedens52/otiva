import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

/**
 * GET /api/deals/eligible?listingId=...
 * Возвращает список пользователей, с которыми есть чат по объявлению
 * и которым продавец может закрыть сделку.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 })

    const listingId = req.nextUrl.searchParams.get("listingId")
    if (!listingId) return NextResponse.json({ error: "Нужен listingId" }, { status: 400 })

    // Только для своих объявлений
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { sellerId: true },
    })
    if (!listing || listing.sellerId !== user.id) {
      return NextResponse.json({ error: "Объявление не найдено или нет доступа" }, { status: 404 })
    }

    // Находим все разговоры по этому объявлению с участием продавца
    const conversations = await prisma.conversation.findMany({
      where: {
        listingId,
        members: { some: { userId: user.id } },
      },
      include: {
        members: {
          where: { userId: { not: user.id } },
          include: { user: { select: { id: true, name: true, avatar: true, phone: true } } },
        },
        messages: { select: { senderId: true }, take: 100 },
      },
    })

    const buyers = conversations
      .filter((c) => {
        const senderIds = new Set(c.messages.map((m) => m.senderId))
        // Обе стороны писали
        const otherMember = c.members[0]
        return senderIds.has(user.id) && otherMember && senderIds.has(otherMember.userId)
      })
      .map((c) => {
        const member = c.members[0]
        return {
          conversationId: c.id,
          user: member?.user ?? null,
        }
      })
      .filter((b) => b.user !== null)

    return NextResponse.json({ ok: true, buyers })
  } catch (error) {
    console.error("GET /api/deals/eligible error:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}
