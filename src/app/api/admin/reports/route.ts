import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { withAdminApi } from "@/lib/admin/guards"
import { writeAudit, AuditAction } from "@/lib/admin/audit"
import { extractIp, extractUA } from "@/lib/admin/getRequestMeta"

export const dynamic = "force-dynamic"

const patchSchema = z.object({
  id: z.string().min(1),
  status: z.string().min(1).max(32),
})

export const GET = withAdminApi(async () => {
  try {
    const reports = await prisma.report.findMany({
      include: {
        listing: { select: { id: true, title: true } },
        targetUser: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    })
    return NextResponse.json({ reports })
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}, "reports.view")

export const PATCH = withAdminApi(async ({ staff, req }) => {
  try {
    const { id, status } = patchSchema.parse(await req.json())

    await prisma.report.update({
      where: { id },
      data: { status },
    })

    await writeAudit({
      actorId: staff.id,
      action: AuditAction.ADMIN_REPORT_STATUS_CHANGED,
      targetType: "Report",
      targetId: id,
      metadata: { status },
      ip: extractIp(req),
      userAgent: extractUA(req),
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}, "reports.resolve")

