import { NextRequest, NextResponse } from "next/server"
import { getAdminSessionFromRequest, revokeAdminSessionFromRequest } from "@/lib/admin/adminSession"
import { writeAudit, AuditAction } from "@/lib/admin/audit"
import { extractIp, extractUA } from "@/lib/admin/getRequestMeta"

export async function POST(req: NextRequest): Promise<NextResponse> {
  const ctx = await getAdminSessionFromRequest(req)
  await revokeAdminSessionFromRequest(req)

  if (ctx) {
    await writeAudit({
      actorId: ctx.staff.id,
      action: AuditAction.ADMIN_LOGOUT,
      metadata: { client: "staff-app" },
      ip: extractIp(req),
      userAgent: extractUA(req),
    })
  }

  return NextResponse.json({ ok: true })
}
