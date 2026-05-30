import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

const bodySchema = z.object({
  id: z.string().min(1),
  type: z.enum(["impression", "click"]),
})

export async function POST(req: NextRequest) {
  try {
    const { id, type } = bodySchema.parse(await req.json())
    const now = new Date()

    if (type === "impression") {
      await prisma.bannerSlotAd.updateMany({
        where: { id, active: true },
        data: {
          impressions: { increment: 1 },
          lastImpressionAt: now,
        },
      })
    } else {
      await prisma.bannerSlotAd.updateMany({
        where: { id, active: true },
        data: {
          clicks: { increment: 1 },
          lastClickAt: now,
        },
      })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }
}
