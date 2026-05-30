import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { withAdminApi } from "@/lib/admin/guards"
import { requireAnyAdminPermission } from "@/lib/admin/permissions"
import { adminDb } from "@/lib/admin/prismaAdmin"

export const dynamic = 'force-dynamic'

const querySchema = z.object({
  action:     z.string().max(64).optional(),
  actorId:    z.string().max(32).optional(),
  targetType: z.string().max(32).optional(),
  targetId:   z.string().max(32).optional(),
  from:       z.string().datetime().optional(),
  to:         z.string().datetime().optional(),
  cursor:     z.string().max(32).optional(),
  limit:      z.coerce.number().min(1).max(100).default(50),
})

export const GET = withAdminApi(async ({ staff, req }): Promise<NextResponse> => {
  // Только OWNER и ADMIN
  requireAnyAdminPermission(staff, ["audit.view"])

  const params = Object.fromEntries(req.nextUrl.searchParams)
  const q      = querySchema.parse(params)

  const where = {
    ...(q.action     ? { action:     q.action }     : {}),
    ...(q.actorId    ? { actorId:    q.actorId }    : {}),
    ...(q.targetType ? { targetType: q.targetType } : {}),
    ...(q.targetId   ? { targetId:   q.targetId }   : {}),
    ...(q.from || q.to ? {
      createdAt: {
        ...(q.from ? { gte: new Date(q.from) } : {}),
        ...(q.to   ? { lte: new Date(q.to)   } : {}),
      },
    } : {}),
  }

  const [items, total] = await Promise.all([
    adminDb.adminAuditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take:    q.limit + 1,
      ...(q.cursor ? { cursor: { id: q.cursor }, skip: 1 } : {}),
    }),
    adminDb.adminAuditLog.count({ where }),
  ])

  const hasMore   = items.length > q.limit
  const page      = hasMore ? items.slice(0, q.limit) : items
  const nextCursor = hasMore ? page[page.length - 1]?.id : null

  return NextResponse.json({ items: page, total, nextCursor })
}, "audit.view")

