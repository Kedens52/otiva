import { NextRequest, NextResponse } from "next/server"
import { revokeAdminSession, getAdminSession } from "@/lib/admin/adminSession"
import { writeAudit, AuditAction } from "@/lib/admin/audit"
import { extractIp, extractUA } from "@/lib/admin/getRequestMeta"
import { validateCsrf } from "@/lib/admin/csrf"

export async function POST(req: NextRequest): Promise<NextResponse> {
  validateCsrf(req)

  const ctx = await getAdminSession()

  await revokeAdminSession()

  if (ctx) {
    await writeAudit({
      actorId:   ctx.staff.id,
      action:    AuditAction.ADMIN_LOGOUT,
      ip:        extractIp(req),
      userAgent: extractUA(req),
    })
  }

  return NextResponse.json({ ok: true })
}
