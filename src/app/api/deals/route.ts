import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

const createDealSchema = z.object({
  listingId: z.string().min(1),
  buyerId: z.string().min(1),
})

/**
 * POST /api/deals
 * Продавец завершает сделку — выбирает покупателя из своих чатов по объявлению.
 * Создаётся Deal со статусом COMPLETED. Обе стороны могут оставить отзыв.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 })

    const body = createDealSchema.parse(await req.json())

    if (user.id === body.buyerId) {
      return NextResponse.json({ error: "Нельзя создать сделку с самим собой" }, { status: 400 })
    }

    // Проверяем, что объявление принадлежит продавцу
    const listing = await prisma.listing.findUnique({
      where: { id: body.listingId },
      select: { id: true, sellerId: true, status: true, title: true },
    })

    if (!listing) {
      return NextResponse.json({ error: "Объявление не найдено" }, { status: 404 })
    }
    if (listing.sellerId !== user.id) {
      return NextResponse.json({ error: "Это не ваше объявление" }, { status: 403 })
    }

    // Проверяем, что есть чат с покупателем по этому объявлению с сообщениями от обеих сторон
    const conversation = await prisma.conversation.findFirst({
      where: {
        listingId: body.listingId,
        members: { some: { userId: user.id } },
        AND: [{ members: { some: { userId: body.buyerId } } }],
      },
      include: { messages: { select: { senderId: true } } },
    })

    if (!conversation) {
      return NextResponse.json(
        { error: "Нет диалога с этим пользователем по объявлению" },
        { status: 400 },
      )
    }

    const senderIds = new Set(conversation.messages.map((m) => m.senderId))
    if (!senderIds.has(user.id) || !senderIds.has(body.buyerId)) {
      return NextResponse.json(
        { error: "В диалоге нет сообщений от обеих сторон" },
        { status: 400 },
      )
    }

    // Проверяем, нет ли уже завершённой сделки по этому объявлению с этим покупателем
    const existingDeal = await prisma.deal.findFirst({
      where: {
        listingId: body.listingId,
        buyerId: body.buyerId,
        sellerId: user.id,
        status: "COMPLETED",
      },
    })
    if (existingDeal) {
      return NextResponse.json({ error: "Сделка уже завершена", dealId: existingDeal.id }, { status: 409 })
    }

    const now = new Date()

    // Создаём Deal и переводим объявление в SOLD
    const [deal] = await prisma.$transaction([
      prisma.deal.create({
        data: {
          listingId: body.listingId,
          sellerId: user.id,
          buyerId: body.buyerId,
          conversationId: conversation.id,
          status: "COMPLETED",
          completedAt: now,
        },
      }),
      prisma.listing.update({
        where: { id: body.listingId },
        data: { status: "SOLD" },
      }),
    ])

    const { tryDealCompletedBonuses } = await import("@/lib/bonuses/hooks")
    void tryDealCompletedBonuses(
      { id: deal.id, sellerId: deal.sellerId, buyerId: deal.buyerId, listingId: deal.listingId },
      prisma,
    ).catch(() => {})

    return NextResponse.json({ ok: true, deal }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error("POST /api/deals error:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}
