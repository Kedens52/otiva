import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getPendingReviewDeals } from "@/lib/reviews/user-reviews"

export const dynamic = "force-dynamic"

/**
 * GET /api/profile/reviews/pending
 * Сделки, по которым текущий пользователь ещё не оставил отзыв.
 */
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 })

    const deals = await getPendingReviewDeals(user.id)

    return NextResponse.json({
      ok: true,
      deals: (deals as any[]).map((d: any) => ({
        dealId: d.id,
        listingId: d.listingId,
        listingTitle: d.listing.title,
        listingSlug: d.listing.slug,
        listingImage: d.listing.images[0] ?? null,
        completedAt: d.completedAt,
        otherUser: d.sellerId === user.id ? d.buyer : d.seller,
        userRole: d.sellerId === user.id ? "seller" : "buyer",
      })),
    })
  } catch (error) {
    console.error("GET /api/profile/reviews/pending error:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}
