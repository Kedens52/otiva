import { NextResponse } from "next/server"
import { z } from "zod"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { withAdminApi } from "@/lib/admin/guards"
import { writeAudit, AuditAction } from "@/lib/admin/audit"
import { extractIp, extractUA } from "@/lib/admin/getRequestMeta"
import { DEFAULT_LISTING_SCORE_WEIGHTS, mergeListingScoreWeights } from "@/lib/listings/scoring/weights-default"
import { invalidateListingScoreWeightsCache } from "@/lib/listings/scoring/load-weights"
import type { ListingScoreWeights } from "@/lib/listings/scoring/types"

export const dynamic = "force-dynamic"

const nestedNumbers = z.record(z.coerce.number())

const patchSchema = z
  .object({
    relevance: nestedNumbers.optional(),
    quality: nestedNumbers.optional(),
    freshness: nestedNumbers.optional(),
    location: nestedNumbers.optional(),
    sellerTrust: nestedNumbers.optional(),
    promotion: nestedNumbers.optional(),
    penalty: nestedNumbers.optional(),
    promotionCapPercent: z.coerce.number().min(0).max(50).optional(),
    maxPromotedPageRatio: z.coerce.number().min(0).max(0.6).optional(),
  })
  .strict()

export const GET = withAdminApi(async ({ staff, req }) => {
  const row = await prisma.listingRankingSettings.findUnique({ where: { id: "default" } })
  const weights = mergeListingScoreWeights(row?.weights as Partial<ListingScoreWeights> | undefined)

  await writeAudit({
    actorId: staff.id,
    action: AuditAction.ADMIN_SETTINGS_VIEWED,
    targetType: "ListingRankingSettings",
    metadata: { section: "listing-scoring" },
    ip: extractIp(req),
    userAgent: extractUA(req),
  })

  return NextResponse.json({
    weights,
    defaults: DEFAULT_LISTING_SCORE_WEIGHTS,
    updatedAt: row?.updatedAt ?? null,
  })
}, "settings.view")

export const PATCH = withAdminApi(async ({ staff, req }) => {
  const body = patchSchema.parse(await req.json())
  const existing = await prisma.listingRankingSettings.findUnique({ where: { id: "default" } })
  const current = mergeListingScoreWeights(existing?.weights as Partial<ListingScoreWeights> | undefined)

  const next: ListingScoreWeights = {
    relevance: { ...current.relevance, ...body.relevance },
    quality: { ...current.quality, ...body.quality },
    freshness: { ...current.freshness, ...body.freshness },
    location: { ...current.location, ...body.location },
    sellerTrust: { ...current.sellerTrust, ...body.sellerTrust },
    promotion: { ...current.promotion, ...body.promotion },
    penalty: { ...current.penalty, ...body.penalty },
    promotionCapPercent: body.promotionCapPercent ?? current.promotionCapPercent,
    maxPromotedPageRatio: body.maxPromotedPageRatio ?? current.maxPromotedPageRatio,
  }

  const row = await prisma.listingRankingSettings.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      weights: next as unknown as Prisma.InputJsonValue,
    },
    update: {
      weights: next as unknown as Prisma.InputJsonValue,
    },
  })

  invalidateListingScoreWeightsCache()

  await writeAudit({
    actorId: staff.id,
    action: AuditAction.ADMIN_SETTINGS_UPDATED,
    targetType: "ListingRankingSettings",
    metadata: { section: "listing-scoring" },
    ip: extractIp(req),
    userAgent: extractUA(req),
  })

  return NextResponse.json({
    weights: mergeListingScoreWeights(row.weights as Partial<ListingScoreWeights>),
    updatedAt: row.updatedAt,
  })
}, "settings.view")
