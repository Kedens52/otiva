import { NextResponse } from "next/server"
import { withAdminApi } from "@/lib/admin/guards"
import { recalculateUserRating } from "@/lib/reviews/user-reviews"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export const POST = withAdminApi(async ({ req }) => {
  const id = req.nextUrl.pathname.split("/").at(-2) ?? ""

  try {
    const review = await prisma.review.findUnique({ where: { id } })
    if (!review || review.isDeleted) {
      return NextResponse.json({ error: "\u041e\u0442\u0437\u044b\u0432 \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d" }, { status: 404 })
    }

    await prisma.review.update({ where: { id }, data: { isHidden: false } })
    await recalculateUserRating(review.targetUserId)

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("POST /api/admin/reviews/[id]/restore error:", error)
    return NextResponse.json({ error: "\u041e\u0448\u0438\u0431\u043a\u0430 \u0441\u0435\u0440\u0432\u0435\u0440\u0430" }, { status: 500 })
  }
}, "listings.moderate")
