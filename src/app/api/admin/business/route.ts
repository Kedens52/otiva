import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { withAdminApi } from "@/lib/admin/guards"
import { writeAudit, AuditAction } from "@/lib/admin/audit"
import { extractIp, extractUA } from "@/lib/admin/getRequestMeta"

export const dynamic = "force-dynamic"

export const GET = withAdminApi(async ({ req }) => {
  const { searchParams } = req.nextUrl
  const q = searchParams.get("q") || ""
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10))
  const take = 50

  const where = q
    ? {
        OR: [
          { companyName: { contains: q, mode: "insensitive" as const } },
          { contactName: { contains: q, mode: "insensitive" as const } },
          { phone: { contains: q } },
        ],
      }
    : {}

  try {
    const [items, total] = await Promise.all([
      prisma.businessClient.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * take,
        take,
        include: {
          assignedManager: { select: { displayName: true, login: true } },
          _count: { select: { deals: true, businessNotes: true } },
        },
      }),
      prisma.businessClient.count({ where }),
    ])

    return NextResponse.json({ ok: true, items, total, page })
  } catch (error) {
    console.error("business GET error:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}, "business.view")

const createSchema = z.object({
  companyName: z.string().min(1).max(200),
  contactName: z.string().max(100).optional(),
  phone: z.string().max(30).optional(),
  email: z.string().email().optional().or(z.literal("")),
  city: z.string().max(100).optional(),
  source: z.string().max(100).optional(),
  notes: z.string().max(2000).optional(),
})

export const POST = withAdminApi(async ({ staff, req }) => {
  try {
    const body = createSchema.parse(await req.json())
    const client = await prisma.businessClient.create({
      data: { ...body, assignedManagerId: staff.id },
    })

    await writeAudit({
      actorId: staff.id,
      action: AuditAction.ADMIN_BUSINESS_CLIENT_CREATED,
      targetType: "BusinessClient",
      targetId: client.id,
      metadata: { companyName: client.companyName },
      ip: extractIp(req),
      userAgent: extractUA(req),
    })

    return NextResponse.json({ ok: true, client })
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors[0].message }, { status: 400 })
    }
    console.error("business POST error:", e)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}, "business.create")
