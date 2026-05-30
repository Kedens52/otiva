import { NextRequest, NextResponse } from "next/server"
import { withAdminApi } from "@/lib/admin/guards"
import { expandPermissions } from "@/lib/admin/permissions"

export const dynamic = 'force-dynamic'

export const GET = withAdminApi(async ({ staff }): Promise<NextResponse> => {
  return NextResponse.json({
    id:          staff.id,
    login:       staff.login,
    displayName: staff.displayName,
    role:        staff.role,
    status:      staff.status,
    permissions: expandPermissions(staff.role),
  })
}, "admin.access")

