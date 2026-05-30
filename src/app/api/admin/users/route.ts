import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { withAdminApi } from "@/lib/admin/guards"
import { writeAudit, AuditAction } from "@/lib/admin/audit"
import { extractIp, extractUA } from "@/lib/admin/getRequestMeta"

export const dynamic = 'force-dynamic'

const patchSchema = z.object({
  userId: z.string().min(1),
  isBanned: z.boolean(),
})


export const GET = withAdminApi(async ({ req }) => {
  try {
    const { searchParams } = req.nextUrl
    const q    = searchParams.get("q") || ""
    const page = Math.max(1, Number.parseInt(searchParams.get("page") || "1", 10))
    const take = 50

    const where = q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { phone: { contains: q } },
            { email: { contains: q, mode: "insensitive" as const } },
            { city: { contains: q, mode: "insensitive" as const } },
            { id: { equals: q } },
          ],
        }
      : {}

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          vkId: true,
          yandexId: true,
          city: true,
          rating: true,
          isVerified: true,
          emailVerified: true,
          phoneVerifiedAt: true,
          isBanned: true,
          role: true,
          walletBalance: true,
          lastLoginAt: true,
          lastLoginIp: true,
          lastSeenAt: true,
          createdAt: true,
          profileType: true,
          region: true,
          city: true,
          trustTier: true,
          _count: { select: { listings: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * take,
        take,
      }),
      prisma.user.count({ where }),
    ])

    return NextResponse.json({ ok: true, items, total, page })
  } catch (error) {
    console.error("admin users GET error:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}, "users.viewSensitive")

export const PATCH = withAdminApi(async ({ staff, req }) => {
  try {
    const { userId, isBanned } = patchSchema.parse(await req.json())

    await prisma.user.update({
      where: { id: userId },
      data: { isBanned },
    })

    await writeAudit({
      actorId: staff.id,
      action: isBanned ? AuditAction.ADMIN_USER_BLOCKED : AuditAction.ADMIN_USER_UNBLOCKED,
      targetType: "User",
      targetId: userId,
      metadata: { isBanned },
      ip: extractIp(req),
      userAgent: extractUA(req),
    })

    return NextResponse.json({ ok: true, userId, isBanned })
  } catch (error) {
    console.error("admin users PATCH error:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}, "users.ban")
