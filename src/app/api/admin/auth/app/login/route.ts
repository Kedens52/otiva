import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createAdminBearerSession } from "@/lib/admin/adminSession"
import { writeAudit, AuditAction } from "@/lib/admin/audit"
import { extractIp, extractUA } from "@/lib/admin/getRequestMeta"
import { authenticateStaffLogin } from "@/lib/admin/staff-login"
import { expandPermissions } from "@/lib/admin/permissions"

const bodySchema = z.object({
  login: z.string().min(1).max(64),
  code: z.string().min(8).max(32),
})

/** Вход для десктоп-приложения сотрудников (Bearer, без cookie). */
export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: z.infer<typeof bodySchema>
  try {
    body = bodySchema.parse(await req.json())
  } catch {
    return NextResponse.json({ error: "Неверный логин или код" }, { status: 401 })
  }

  const result = await authenticateStaffLogin(req, body.login.trim(), body.code.trim())
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  const { staff } = result
  const session = await createAdminBearerSession(
    { id: staff.id, role: staff.role, status: staff.status },
    req,
  )

  await writeAudit({
    actorId: staff.id,
    action: AuditAction.ADMIN_LOGIN_SUCCESS,
    metadata: { role: staff.role, client: "staff-app" },
    ip: extractIp(req),
    userAgent: extractUA(req),
  })

  return NextResponse.json({
    ok: true,
    accessToken: session.accessToken,
    expiresAt: session.expiresAt,
    staff: {
      id: session.context.staff.id,
      login: session.context.staff.login,
      displayName: session.context.staff.displayName,
      role: session.context.staff.role,
      permissions: expandPermissions(session.context.staff.role),
    },
  })
}
