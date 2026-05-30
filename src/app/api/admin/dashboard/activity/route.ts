import { NextResponse } from "next/server"
import { z } from "zod"
import { withAdminApi } from "@/lib/admin/guards"
import { requireAnyAdminPermission, hasAdminPermission } from "@/lib/admin/permissions"
import {
  activityRowsToCsv,
  getActivityForTab,
  type ActivityTab,
} from "@/lib/admin/dashboard-activity"

export const dynamic = "force-dynamic"

const querySchema = z.object({
  tab: z.enum(["visits", "registrations", "logins", "staff"]).default("visits"),
  days: z.coerce.number().min(0).max(90).default(7),
  q: z.string().max(120).optional(),
  guestOnly: z.enum(["0", "1"]).optional(),
  authOnly: z.enum(["0", "1"]).optional(),
  cursor: z.string().max(64).optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  format: z.enum(["json", "csv"]).default("json"),
})

export const GET = withAdminApi(async ({ staff, req }): Promise<NextResponse> => {
  requireAnyAdminPermission(staff, ["activity.view", "users.view"])

  const raw = Object.fromEntries(req.nextUrl.searchParams)
  const q = querySchema.parse(raw)

  const showSensitive = hasAdminPermission(staff, "users.viewSensitive")
  const canViewUsers = hasAdminPermission(staff, "users.view")

  const result = await getActivityForTab({
    tab: q.tab as ActivityTab,
    days: q.days,
    q: q.q,
    guestOnly: q.guestOnly === "1",
    authOnly: q.authOnly === "1",
    cursor: q.cursor,
    limit: q.limit,
    showSensitive,
    canViewUsers,
  })

  if (q.format === "csv") {
    const csv = activityRowsToCsv(result.tab, result.items)
    const filename = `activity-${result.tab}-${new Date().toISOString().slice(0, 10)}.csv`
    return new NextResponse("\uFEFF" + csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  }

  return NextResponse.json({
    ok: true,
    tab: result.tab,
    items: result.items,
    nextCursor: result.nextCursor,
    showSensitive,
    canViewUsers,
  })
})
