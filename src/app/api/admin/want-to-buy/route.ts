import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { withAdminApi } from "@/lib/admin/guards"
import { writeAudit, AuditAction } from "@/lib/admin/audit"
import { extractIp, extractUA } from "@/lib/admin/getRequestMeta"
import { setWantToBuyModerationStatus } from "@/lib/want-to-buy/admin-moderation"

export const dynamic = "force-dynamic"

const statusSchema = z.enum(["MODERATION", "ACTIVE", "REJECTED", "CLOSED", "EXPIRED"])

const actionSchema = z.object({
  wantToBuyId: z.string().min(1),
  action: z.enum(["APPROVED", "REJECTED", "CLOSED"]),
  reason: z.string().trim().max(500).optional(),
  moderationReasonCode: z.string().trim().max(64).optional(),
})

export const GET = withAdminApi(async ({ req }) => {
  try {
    const { searchParams } = req.nextUrl

    if (searchParams.get("stats") === "1") {
      const weekAgo = new Date(Date.now() - 7 * 86_400_000)
      const [moderation, active, rejected, expired, closed, offersWeek, createdWeek] = await Promise.all([
        prisma.wantToBuy.count({ where: { status: "MODERATION" } }),
        prisma.wantToBuy.count({ where: { status: "ACTIVE" } }),
        prisma.wantToBuy.count({ where: { status: "REJECTED" } }),
        prisma.wantToBuy.count({ where: { status: "EXPIRED" } }),
        prisma.wantToBuy.count({ where: { status: "CLOSED" } }),
        prisma.wantToBuyOffer.count({ where: { createdAt: { gte: weekAgo } } }),
        prisma.wantToBuy.count({ where: { createdAt: { gte: weekAgo } } }),
      ])
      return NextResponse.json({
        ok: true,
        stats: { moderation, active, rejected, expired, closed, offersWeek, createdWeek },
      })
    }

    const status = statusSchema.parse(searchParams.get("status") || "MODERATION")
    const page = Math.max(1, Number.parseInt(searchParams.get("page") || "1", 10))
    const search = (searchParams.get("search") ?? "").trim()
    const take = 50

    const where = search
      ? {
          status,
          OR: [
            { title: { contains: search, mode: "insensitive" as const } },
            { description: { contains: search, mode: "insensitive" as const } },
            { city: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : { status }

    const [items, total] = await Promise.all([
      prisma.wantToBuy.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, phone: true, city: true } },
          category: { select: { slug: true, nameRu: true } },
          _count: { select: { offers: true } },
        },
        orderBy: { createdAt: "asc" },
        skip: (page - 1) * take,
        take,
      }),
      prisma.wantToBuy.count({ where }),
    ])

    return NextResponse.json({ ok: true, items, total, page })
  } catch (error) {
    console.error("admin want-to-buy GET error:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}, "listings.view")

export const POST = withAdminApi(async ({ staff, req }) => {
  try {
    const { wantToBuyId, action, reason, moderationReasonCode } = actionSchema.parse(await req.json())

    const rejectionReason = reason?.trim() || null
    if (action === "REJECTED" && !rejectionReason) {
      return NextResponse.json({ error: "Укажите причину отклонения" }, { status: 400 })
    }

    const status =
      action === "APPROVED" ? "ACTIVE" : action === "REJECTED" ? "REJECTED" : "CLOSED"

    const updated = await setWantToBuyModerationStatus({
      wantToBuyId,
      status,
      rejectionReason,
      moderationReasonCode,
    })

    if (!updated) {
      return NextResponse.json({ error: "Заявка не найдена" }, { status: 404 })
    }

    const auditAction =
      action === "APPROVED"
        ? AuditAction.ADMIN_WANT_TO_BUY_APPROVED
        : action === "REJECTED"
          ? AuditAction.ADMIN_WANT_TO_BUY_REJECTED
          : AuditAction.ADMIN_WANT_TO_BUY_CLOSED

    await writeAudit({
      actorId: staff.id,
      action: auditAction,
      targetType: "WantToBuy",
      targetId: wantToBuyId,
      metadata: { action, status, moderationReasonCode: moderationReasonCode ?? null },
      ip: extractIp(req),
      userAgent: extractUA(req),
    })

    return NextResponse.json({ ok: true, item: updated })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0]?.message ?? "Ошибка валидации" }, { status: 400 })
    }
    console.error("admin want-to-buy POST error:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}, "listings.moderate")
