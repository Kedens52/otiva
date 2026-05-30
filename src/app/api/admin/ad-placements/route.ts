import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { AdPlacementDeviceScope, AdPlacementKind } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { withAdminApi } from "@/lib/admin/guards"
import { writeAudit, AuditAction } from "@/lib/admin/audit"
import { extractIp, extractUA } from "@/lib/admin/getRequestMeta"
import {
  listPlacementConfigs,
  serializePlacementConfig,
} from "@/lib/ads/placement-config-service"

export const dynamic = "force-dynamic"

const placementSchema = z.object({
  id: z.string().min(1),
  code: z.string().min(1).max(80),
  kind: z.nativeEnum(AdPlacementKind),
  name: z.string().min(1).max(200),
  description: z.string().max(4000).optional().nullable(),
  pages: z.string().max(500).optional().nullable(),
  whereOnPage: z.string().max(4000).optional().nullable(),
  deviceScope: z.nativeEnum(AdPlacementDeviceScope),
  designWidth: z.number().int().positive().optional().nullable(),
  designHeight: z.number().int().positive().optional().nullable(),
  displayWidth: z.number().int().positive().optional().nullable(),
  allowedFormats: z.array(z.string().max(80)).default([]),
  maxFileBytes: z.number().int().positive().optional().nullable(),
  active: z.boolean(),
  maxActiveCreatives: z.number().int().min(1).max(50),
  sortPriority: z.number().int().min(0).max(9999),
  pricePerMinute: z.number().int().nonnegative().optional().nullable(),
  pricePerHour: z.number().int().nonnegative().optional().nullable(),
  pricePerDay: z.number().int().nonnegative().optional().nullable(),
  pricePerWeek: z.number().int().nonnegative().optional().nullable(),
  fallbackTitle: z.string().max(200).optional().nullable(),
  fallbackSubtitle: z.string().max(500).optional().nullable(),
  fallbackCta: z.string().max(80).optional().nullable(),
  fallbackHref: z.string().max(500).optional().nullable(),
})

const syncSchema = z.object({
  placements: z.array(placementSchema).min(1),
})

export const GET = withAdminApi(async ({ staff, req }) => {
  const placements = await listPlacementConfigs(prisma)

  await writeAudit({
    actorId: staff.id,
    action: AuditAction.ADMIN_SETTINGS_VIEWED,
    targetType: "AdPlacementConfig",
    targetId: "all",
    ip: extractIp(req),
    userAgent: extractUA(req),
  }).catch(() => {})

  return NextResponse.json({ placements })
}, "settings.view")

export const PUT = withAdminApi(async ({ staff, req }) => {
  const body = syncSchema.parse(await req.json())

  const updated = await prisma.$transaction(
    body.placements.map((p) =>
      prisma.adPlacementConfig.update({
        where: { id: p.id },
        data: {
          name: p.name,
          description: p.description ?? null,
          pages: p.pages ?? null,
          whereOnPage: p.whereOnPage ?? null,
          deviceScope: p.deviceScope,
          designWidth: p.designWidth ?? null,
          designHeight: p.designHeight ?? null,
          displayWidth: p.displayWidth ?? null,
          allowedFormats: p.allowedFormats,
          maxFileBytes: p.maxFileBytes ?? null,
          active: p.active,
          maxActiveCreatives: p.maxActiveCreatives,
          sortPriority: p.sortPriority,
          pricePerMinute: p.pricePerMinute ?? null,
          pricePerHour: p.pricePerHour ?? null,
          pricePerDay: p.pricePerDay ?? null,
          pricePerWeek: p.pricePerWeek ?? null,
          fallbackTitle: p.fallbackTitle ?? null,
          fallbackSubtitle: p.fallbackSubtitle ?? null,
          fallbackCta: p.fallbackCta ?? null,
          fallbackHref: p.fallbackHref ?? null,
        },
      }),
    ),
  )

  await writeAudit({
    actorId: staff.id,
    action: AuditAction.ADMIN_SETTINGS_UPDATED,
    targetType: "AdPlacementConfig",
    targetId: "bulk",
    ip: extractIp(req),
    userAgent: extractUA(req),
    metadata: { count: updated.length },
  }).catch(() => {})

  return NextResponse.json({
    placements: updated.map(serializePlacementConfig),
  })
}, "settings.manage")
