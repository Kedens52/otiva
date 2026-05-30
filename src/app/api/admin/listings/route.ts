import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { withAdminApi } from "@/lib/admin/guards"
import { writeAudit, AuditAction } from "@/lib/admin/audit"
import { extractIp, extractUA } from "@/lib/admin/getRequestMeta"
import { syncUserTrustSnapshot } from "@/lib/trust-tier"
import { syncListingSlug } from "@/lib/seo/sync-listing-slug"
import { notifyListingSearchIndex } from "@/lib/seo/notify-search-index"

export const dynamic = "force-dynamic"

const listingStatusSchema = z.enum(["MODERATION", "ACTIVE", "REJECTED", "ARCHIVED", "SOLD"])
const listingActionSchema = z.object({
  listingId: z.string().min(1),
  action: z.enum(["APPROVED", "REJECTED", "NEEDS_REVISION"]),
  reason: z.string().trim().max(500).optional(),
  moderationReasonCode: z.string().trim().max(64).optional(),
})

export const GET = withAdminApi(async ({ req }) => {
  try {
    const { searchParams } = req.nextUrl
    const status = listingStatusSchema.parse(searchParams.get("status") || "MODERATION")
    const page = Math.max(1, Number.parseInt(searchParams.get("page") || "1", 10))
    const search = searchParams.get("search") ?? ""
    const take = 50

    const where = search
      ? { status, title: { contains: search, mode: "insensitive" as const } }
      : { status }

    const [items, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        include: {
          seller: { select: { id: true, name: true, phone: true, city: true } },
          category: { select: { slug: true, nameRu: true } },
          priceInsight: { select: { status: true, min: true, max: true, sampleSize: true, reason: true } },
        },
        orderBy: { createdAt: "asc" },
        skip: (page - 1) * take,
        take,
      }),
      prisma.listing.count({ where }),
    ])

    return NextResponse.json({ ok: true, items, total, page })
  } catch (error) {
    console.error("admin listings GET error:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}, "listings.view")

export const POST = withAdminApi(async ({ staff, req }) => {
  try {
    const { listingId, action, reason, moderationReasonCode } = listingActionSchema.parse(await req.json())

    const rejectionReason = reason?.trim() || null
    if (action !== "APPROVED" && !rejectionReason) {
      return NextResponse.json({ error: "Укажите причину" }, { status: 400 })
    }

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { sellerId: true },
    })
    if (!listing) {
      return NextResponse.json({ error: "Не найдено" }, { status: 404 })
    }

    if (action === "APPROVED") {
      await prisma.listing.update({
        where: { id: listingId },
        data: {
          status: "ACTIVE",
          rejectionReason: null,
          moderationReasonCode: null,
          returnedForRevision: false,
        },
      })
      await prisma.moderationLog.create({
        data: { listingId, staffId: staff.id, action: "APPROVED", reason: null },
      }).catch(console.error)
      await writeAudit({
        actorId: staff.id,
        action: AuditAction.ADMIN_LISTING_APPROVED,
        targetType: "Listing",
        targetId: listingId,
        metadata: { status: "ACTIVE" },
        ip: extractIp(req),
        userAgent: extractUA(req),
      })
      void syncUserTrustSnapshot(listing.sellerId)
      void syncListingSlug(listingId).catch(() => {})
      void notifyListingSearchIndex(listingId)
      return NextResponse.json({ ok: true, listingId, action, newStatus: "ACTIVE" })
    }

    if (action === "NEEDS_REVISION") {
      await prisma.listing.update({
        where: { id: listingId },
        data: {
          status: "MODERATION",
          rejectionReason,
          moderationReasonCode: moderationReasonCode ?? null,
          returnedForRevision: true,
        },
      })
      await prisma.moderationLog.create({
        data: { listingId, staffId: staff.id, action: "FLAGGED", reason: rejectionReason },
      }).catch(console.error)
      await writeAudit({
        actorId: staff.id,
        action: AuditAction.ADMIN_LISTING_REJECTED,
        targetType: "Listing",
        targetId: listingId,
        metadata: { status: "MODERATION", needsRevision: true, reason: rejectionReason, moderationReasonCode },
        ip: extractIp(req),
        userAgent: extractUA(req),
      })
      void syncUserTrustSnapshot(listing.sellerId)
      return NextResponse.json({ ok: true, listingId, action, newStatus: "MODERATION" })
    }

    await prisma.listing.update({
      where: { id: listingId },
      data: {
        status: "REJECTED",
        rejectionReason,
        moderationReasonCode: moderationReasonCode ?? null,
        returnedForRevision: false,
      },
    })
    await prisma.moderationLog.create({
      data: { listingId, staffId: staff.id, action: "REJECTED", reason: rejectionReason },
    }).catch(console.error)
    await writeAudit({
      actorId: staff.id,
      action: AuditAction.ADMIN_LISTING_REJECTED,
      targetType: "Listing",
      targetId: listingId,
      metadata: { status: "REJECTED", reason: rejectionReason, moderationReasonCode },
      ip: extractIp(req),
      userAgent: extractUA(req),
    })
    void syncUserTrustSnapshot(listing.sellerId)
    return NextResponse.json({ ok: true, listingId, action, newStatus: "REJECTED" })
  } catch (error) {
    console.error("admin listings POST error:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}, "listings.moderate")
