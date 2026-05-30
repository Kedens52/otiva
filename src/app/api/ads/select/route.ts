import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { AdDevice, AdPlacement } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { selectAds } from "@/lib/ads/select-ad"
import { getCurrentUser } from "@/lib/auth"

export const dynamic = "force-dynamic"

const bodySchema = z.object({
  placement: z.nativeEnum(AdPlacement),
  categoryId: z.string().optional().nullable(),
  subcategoryId: z.string().optional().nullable(),
  cityId: z.string().optional().nullable(),
  regionId: z.string().optional().nullable(),
  districtId: z.string().optional().nullable(),
  device: z.nativeEnum(AdDevice).optional().nullable(),
  query: z.string().optional().nullable(),
  userId: z.string().optional().nullable(),
  sessionId: z.string().optional().nullable(),
  userInterests: z.array(z.string()).optional(),
  excludeAdIds: z.array(z.string()).optional(),
  lastAdId: z.string().optional().nullable(),
  count: z.number().int().min(1).max(12).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const input = bodySchema.parse(await request.json())
    const sessionUser = await getCurrentUser().catch(() => null)
    const userId = input.userId ?? sessionUser?.id ?? null

    const ads = await selectAds(prisma, {
      placement: input.placement,
      categoryId: input.categoryId,
      subcategoryId: input.subcategoryId,
      cityId: input.cityId,
      regionId: input.regionId,
      districtId: input.districtId,
      device: input.device ?? "ALL",
      query: input.query,
      userId,
      sessionId: input.sessionId,
      userInterests: input.userInterests,
      excludeAdIds: input.excludeAdIds,
      lastAdId: input.lastAdId,
      count: input.count,
    })

    return NextResponse.json({ ads })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0]?.message ?? "Invalid request" }, { status: 400 })
    }
    console.error("[ads/select]", error)
    return NextResponse.json({ ads: [] })
  }
}
