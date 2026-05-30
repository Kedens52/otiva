import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { AdDevice, AdEventType, AdPlacement } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

export const dynamic = "force-dynamic"

const bodySchema = z.object({
  adId: z.string().min(1),
  eventType: z.nativeEnum(AdEventType),
  placement: z.nativeEnum(AdPlacement).optional().nullable(),
  categoryId: z.string().optional().nullable(),
  cityId: z.string().optional().nullable(),
  device: z.nativeEnum(AdDevice).optional().nullable(),
  sessionId: z.string().optional().nullable(),
})

export async function POST(request: NextRequest) {
  try {
    const input = bodySchema.parse(await request.json())
    const user = await getCurrentUser().catch(() => null)

    await prisma.adEvent.create({
      data: {
        adId: input.adId,
        userId: user?.id ?? null,
        sessionId: input.sessionId ?? null,
        eventType: input.eventType,
        placement: input.placement ?? null,
        categoryId: input.categoryId ?? null,
        cityId: input.cityId ?? null,
        device: input.device ?? null,
      },
    })

    if (input.eventType === "IMPRESSION") {
      await prisma.adCampaign.update({
        where: { id: input.adId },
        data: { impressions: { increment: 1 } },
      }).catch(() => {})
    }
    if (input.eventType === "CLICK") {
      await prisma.adCampaign.update({
        where: { id: input.adId },
        data: { clicks: { increment: 1 } },
      }).catch(() => {})
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }
    console.error("[ads/event]", error)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
