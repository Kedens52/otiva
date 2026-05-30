import { NextRequest, NextResponse } from "next/server"
import { getAdminSessionFromRequest } from "@/lib/admin/adminSession"
import { expandPermissions, hasAdminPermission } from "@/lib/admin/permissions"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest): Promise<NextResponse> {
  const ctx = await getAdminSessionFromRequest(req)
  if (!ctx) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 })
  }

  if (!hasAdminPermission(ctx.staff, "admin.access")) {
    return NextResponse.json({ error: "Недостаточно прав" }, { status: 403 })
  }

  return NextResponse.json({
    id: ctx.staff.id,
    login: ctx.staff.login,
    displayName: ctx.staff.displayName,
    role: ctx.staff.role,
    status: ctx.staff.status,
    permissions: expandPermissions(ctx.staff.role),
    canSupport: hasAdminPermission(ctx.staff, "support.view"),
    sessionExpiresAt: ctx.session.expiresAt.toISOString(),
  })
}
