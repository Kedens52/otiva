import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { withAdminApi } from "@/lib/admin/guards"
import { requireAnyAdminPermission } from "@/lib/admin/permissions"
import { auditActionLabel } from "@/lib/admin/audit-labels"

export const dynamic = "force-dynamic"

const querySchema = z.object({
  action: z.string().max(64).optional(),
  actorId: z.string().max(32).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  limit: z.coerce.number().min(1).max(500).default(100),
})

export const GET = withAdminApi(async ({ staff, req }): Promise<NextResponse> => {
  requireAnyAdminPermission(staff, ["audit.view"])

  const q = querySchema.parse(Object.fromEntries(req.nextUrl.searchParams))

  const where = {
    ...(q.action ? { action: q.action } : {}),
    ...(q.actorId ? { actorId: q.actorId } : {}),
    ...(q.from || q.to
      ? {
          createdAt: {
            ...(q.from ? { gte: new Date(q.from) } : {}),
            ...(q.to ? { lte: new Date(q.to) } : {}),
          },
        }
      : {}),
  }

  const rows = await prisma.adminAuditLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: q.limit,
    select: {
      id: true,
      action: true,
      actorId: true,
      targetType: true,
      targetId: true,
      ip: true,
      createdAt: true,
      actor: { select: { login: true, displayName: true } },
    },
  })

  const escape = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`
  const csv = [
    "at,action,label,actor,targetType,targetId,ip",
    ...rows.map((r) =>
      [
        r.createdAt.toISOString(),
        r.action,
        auditActionLabel(r.action),
        r.actor?.displayName ?? r.actor?.login ?? r.actorId ?? "",
        r.targetType ?? "",
        r.targetId ?? "",
        r.ip ?? "",
      ]
        .map(escape)
        .join(","),
    ),
  ].join("\n")

  return new NextResponse("\uFEFF" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="audit-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}, "audit.view")
