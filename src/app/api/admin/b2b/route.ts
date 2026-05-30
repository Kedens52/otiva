import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { withAdminApi } from "@/lib/admin/guards"
import { writeAudit, AuditAction } from "@/lib/admin/audit"
import { extractIp, extractUA } from "@/lib/admin/getRequestMeta"
import { computeCompanyRiskFlags } from "@/lib/business/risk-flags"
import { companyPublicPath } from "@/lib/business/get-public-company"

export const dynamic = "force-dynamic"

const actionSchema = z.object({
  entity: z.enum(["company", "listing", "inquiry"]),
  id: z.string().min(1),
  action: z.enum(["APPROVE", "REJECT", "BLOCK", "SPAM", "CLOSE"]),
  reason: z.string().max(500).optional(),
})

export const GET = withAdminApi(async ({ req }) => {
  const tab = req.nextUrl.searchParams.get("tab") ?? "companies"

  if (tab === "listings") {
    const items = await prisma.businessListing.findMany({
      where: { status: "PENDING" },
      include: {
        company: { select: { id: true, name: true, inn: true, verificationStatus: true } },
      },
      orderBy: { createdAt: "asc" },
      take: 50,
    })
    return NextResponse.json({ ok: true, items })
  }

  if (tab === "inquiries") {
    const items = await prisma.businessInquiry.findMany({
      where: { status: { in: ["NEW", "IN_PROGRESS"] } },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        toCompany: { select: { name: true } },
      },
    })
    return NextResponse.json({ ok: true, items })
  }

  if (tab === "reports") {
    const items = await prisma.report.findMany({
      where: {
        status: "pending",
        OR: [{ companyId: { not: null } }, { businessListingId: { not: null } }],
      },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        company: { select: { id: true, name: true } },
      },
    })
    return NextResponse.json({ ok: true, items })
  }

  if (tab === "profiles") {
    const items = await prisma.company.findMany({
      where: { verificationStatus: "VERIFIED", isBlocked: false },
      select: {
        id: true,
        name: true,
        city: true,
        inn: true,
        isPublic: true,
        publicSlug: true,
        logoUrl: true,
        profileCompleteness: true,
        _count: { select: { listings: { where: { status: "ACTIVE" } } } },
      },
      orderBy: { updatedAt: "desc" },
      take: 50,
    })
    return NextResponse.json({
      ok: true,
      items: items.map((c) => ({
        ...c,
        publicPath: companyPublicPath(c),
      })),
    })
  }

  const items = await prisma.company.findMany({
    where: { verificationStatus: "PENDING_REVIEW" },
    orderBy: { createdAt: "asc" },
    take: 50,
    include: {
      owner: { select: { createdAt: true, phone: true, isVerified: true } },
      _count: {
        select: {
          listings: true,
          reports: { where: { status: "pending" } },
          inquiriesReceived: true,
        },
      },
    },
  })

  const withRisk = await Promise.all(
    items.map(async (c) => {
      let duplicateInnCount = 0
      if (c.inn) {
        duplicateInnCount = await prisma.company.count({ where: { inn: c.inn } })
      }
      const since = new Date(Date.now() - 86400000)
      const inquiriesLast24h = await prisma.businessInquiry.count({
        where: { toCompanyId: c.id, createdAt: { gte: since } },
      })
      return {
        ...c,
        riskFlags: computeCompanyRiskFlags({
          ...c,
          ownerCreatedAt: c.owner.createdAt,
          ownerPhoneVerified: Boolean(c.owner.phone && c.owner.isVerified),
          duplicateInnCount,
          activeListingsCount: c._count.listings,
          pendingReportsCount: c._count.reports,
          inquiriesLast24h,
        }),
        publicPath: companyPublicPath(c),
      }
    }),
  )

  return NextResponse.json({ ok: true, items: withRisk })
}, "b2b.companies.view")

export const PATCH = withAdminApi(async ({ staff, req }) => {
  const { entity, id, action, reason } = actionSchema.parse(await req.json())

  if (entity === "inquiry") {
    const status =
      action === "SPAM"
        ? "SPAM"
        : action === "CLOSE"
          ? "CLOSED"
          : action === "APPROVE"
            ? "IN_PROGRESS"
            : "CLOSED"
    const updated = await prisma.businessInquiry.update({
      where: { id },
      data: { status },
    })
    return NextResponse.json({ ok: true, inquiry: updated })
  }

  if (entity === "company") {
    const status =
      action === "APPROVE" ? "VERIFIED" : action === "REJECT" ? "REJECTED" : "BLOCKED"
    const updated = await prisma.company.update({
      where: { id },
      data: {
        verificationStatus: status,
        rejectionReason: action === "APPROVE" ? null : reason ?? null,
        isPublic: action === "APPROVE",
        isBlocked: action === "BLOCK",
        catalogEnabled: action !== "BLOCK",
      },
    })
    await writeAudit({
      actorId: staff.id,
      action: AuditAction.LISTING_MODERATED,
      targetType: "b2b_company",
      targetId: id,
      metadata: { action, status, department: "B2B_MODERATION" },
      ip: extractIp(req),
      userAgent: extractUA(req),
    })
    return NextResponse.json({ ok: true, company: updated })
  }

  const status =
    action === "APPROVE" ? "ACTIVE" : action === "REJECT" ? "REJECTED" : "BLOCKED"
  const updated = await prisma.businessListing.update({
    where: { id },
    data: {
      status,
      rejectionReason: action === "APPROVE" ? null : reason ?? null,
    },
  })
  await writeAudit({
    actorId: staff.id,
    action: AuditAction.LISTING_MODERATED,
    targetType: "b2b_listing",
    targetId: id,
    metadata: { action, status, department: "B2B_MODERATION" },
    ip: extractIp(req),
    userAgent: extractUA(req),
  })
  return NextResponse.json({ ok: true, listing: updated })
}, "b2b.companies.moderate")
