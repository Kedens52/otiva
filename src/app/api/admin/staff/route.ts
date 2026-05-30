import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { withAdminApi } from "@/lib/admin/guards"
import { requireOwner } from "@/lib/admin/permissions"
import { adminDb } from "@/lib/admin/prismaAdmin"
import { generateStaffCode } from "@/lib/admin/generateStaffCode"
import { hashStaffCode } from "@/lib/admin/staffCode"
import { writeAudit, AuditAction } from "@/lib/admin/audit"
import { extractIp, extractUA } from "@/lib/admin/getRequestMeta"

export const dynamic = 'force-dynamic'

const SAFE_SELECT = {
  id:          true,
  login:       true,
  displayName: true,
  role:        true,
  status:      true,
  lastLoginAt: true,
  createdAt:   true,
  createdById: true,
} as const

const listQuerySchema = z.object({
  take:   z.coerce.number().min(1).max(100).default(50),
  skip:   z.coerce.number().min(0).default(0),
  status: z.enum(["ACTIVE", "SUSPENDED", "REVOKED"]).optional(),
  role:   z.enum(["OWNER", "ADMIN", "MODERATOR", "SUPPORT", "BUSINESS_MANAGER", "FINANCE"]).optional(),
})

const createBodySchema = z.object({
  login:       z.string().regex(/^[a-z0-9._-]{3,32}$/, "login: 3-32 символа, только a-z 0-9 . _ -"),
  displayName: z.string().max(100).optional(),
  role:        z.enum(["OWNER", "ADMIN", "MODERATOR", "SUPPORT", "BUSINESS_MANAGER", "FINANCE"]),
})

// GET /api/admin/staff
export const GET = withAdminApi(async ({ req }): Promise<NextResponse> => {
  const params = Object.fromEntries(req.nextUrl.searchParams)
  const query  = listQuerySchema.parse(params)

  const where = {
    ...(query.status ? { status: query.status } : {}),
    ...(query.role   ? { role:   query.role   } : {}),
  }

  const [items, total] = await Promise.all([
    adminDb.staffAccount.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take:    query.take,
      skip:    query.skip,
      select:  SAFE_SELECT,
    }),
    adminDb.staffAccount.count({ where }),
  ])

  return NextResponse.json({ items, total, take: query.take, skip: query.skip })
}, "staff.view")

// POST /api/admin/staff
export const POST = withAdminApi(async ({ staff, req }): Promise<NextResponse> => {
  const body = createBodySchema.parse(await req.json())

  // Назначение OWNER → только OWNER + явное подтверждение
  if (body.role === "OWNER") {
    requireOwner(staff)
    if (req.headers.get("X-Confirm-Owner") !== "yes") {
      return NextResponse.json(
        { error: "Требуется заголовок X-Confirm-Owner: yes для назначения Владельца" },
        { status: 400 },
      )
    }
  }

  // Проверяем уникальность login
  const existing = await adminDb.staffAccount.findUnique({ where: { login: body.login } })
  if (existing) {
    return NextResponse.json({ error: "Логин уже занят" }, { status: 409 })
  }

  const code     = generateStaffCode()
  const codeHash = await hashStaffCode(code)
  const now      = new Date()

  const created = await adminDb.staffAccount.create({
    data: {
      login:          body.login,
      displayName:    body.displayName ?? null,
      role:           body.role,
      status:         "ACTIVE",
      codeHash,
      codeChangedAt:  now,
      failedAttempts: 0,
      lockedUntil:    null,
      lastLoginAt:    null,
      lastLoginIp:    null,
      lastUserAgent:  null,
      revokedAt:      null,
      createdById:    staff.id,
    },
  })

  await writeAudit({
    actorId:    staff.id,
    action:     AuditAction.ADMIN_STAFF_CREATED,
    targetType: "StaffAccount",
    targetId:   created.id,
    metadata:   { login: body.login, role: body.role },
    ip:         extractIp(req),
    userAgent:  extractUA(req),
  })

  return NextResponse.json({
    id:    created.id,
    login: created.login,
    role:  created.role,
    code,  // единственный показ
  }, { status: 201 })
}, "staff.create")

