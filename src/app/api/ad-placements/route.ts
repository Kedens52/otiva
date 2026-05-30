import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { listPlacementConfigs } from "@/lib/ads/placement-config-service"

export const dynamic = "force-dynamic"

/** Публичный справочник мест и цен (без внутренних полей модерации) */
export async function GET() {
  try {
    const placements = await listPlacementConfigs(prisma)
    return NextResponse.json({
      placements: placements
        .filter((p) => p.active)
        .map((p) => ({
          code: p.code,
          kind: p.kind,
          name: p.name,
          pages: p.pages,
          whereOnPage: p.whereOnPage,
          deviceScope: p.deviceScope,
          designWidth: p.designWidth,
          designHeight: p.designHeight,
          allowedFormats: p.allowedFormats,
          maxFileBytes: p.maxFileBytes,
          pricePerMinute: p.pricePerMinute,
          pricePerHour: p.pricePerHour,
          pricePerDay: p.pricePerDay,
          pricePerWeek: p.pricePerWeek,
        })),
    })
  } catch {
    return NextResponse.json({ placements: [] })
  }
}
