import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { recordShareBonus } from "@/lib/bonuses/hooks"
import { getListingPublicPath } from "@/lib/seo/paths"

export const dynamic = "force-dynamic"

const schema = z.object({
  listingId: z.string().min(1),
  platform: z.enum(["VK", "MAX"]),
})

/** Минимальный интервал между шарингами в мс */
const SHARE_COOLDOWN_MS = 30_000

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "\u041d\u0435 \u0430\u0432\u0442\u043e\u0440\u0438\u0437\u043e\u0432\u0430\u043d" }, { status: 401 })

  let body: z.infer<typeof schema>
  try {
    body = schema.parse(await req.json())
  } catch {
    return NextResponse.json({ error: "\u041d\u0435\u0432\u0435\u0440\u043d\u044b\u0435 \u0434\u0430\u043d\u043d\u044b\u0435" }, { status: 400 })
  }

  const listing = await prisma.listing.findFirst({
    where: { id: body.listingId, status: "ACTIVE" },
    select: { id: true, title: true, slug: true, sellerId: true },
  })
  if (!listing) {
    return NextResponse.json({ error: "\u041e\u0431\u044a\u044f\u0432\u043b\u0435\u043d\u0438\u0435 \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d\u043e" }, { status: 404 })
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://nashlo.ru"
  const path = getListingPublicPath(listing)
  const shareUrl = `${siteUrl.replace(/\/$/, "")}${path}`

  let bonus: { ok: boolean; message?: string; points?: number } = { ok: false }

  if (listing.sellerId === user.id) {
    // Серверный cooldown: не засчитывать если был шаринг в последние 30 секунд
    const reason = body.platform === "VK" ? "SHARE_VK" : "SHARE_MAX"
    const recentShare = await prisma.bonusTransaction.findFirst({
      where: {
        userId: user.id,
        reason,
        listingId: body.listingId,
        createdAt: { gte: new Date(Date.now() - SHARE_COOLDOWN_MS) },
      },
      select: { id: true },
    })

    if (recentShare) {
      return NextResponse.json({
        ok: true,
        shareUrl,
        bonus: { ok: false, message: "\u041f\u043e\u0434\u043e\u0436\u0434\u0438\u0442\u0435 \u043d\u0435\u043c\u043d\u043e\u0433\u043e \u043f\u0435\u0440\u0435\u0434 \u043f\u043e\u0432\u0442\u043e\u0440\u043d\u044b\u043c \u0448\u0430\u0440\u0438\u043d\u0433\u043e\u043c" },
      })
    }

    bonus = await recordShareBonus(user.id, listing.id, body.platform, prisma)
  }

  return NextResponse.json({ ok: true, shareUrl, bonus })
}
