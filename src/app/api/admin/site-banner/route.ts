import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { withAdminApi } from "@/lib/admin/guards"
import { writeAudit, AuditAction } from "@/lib/admin/audit"
import { extractIp, extractUA } from "@/lib/admin/getRequestMeta"

export const dynamic = "force-dynamic"

const bannerSchema = z.object({
  id: z.string().optional(),
  title: z.string().max(160).optional().default(""),
  linkText: z.string().max(80).optional().nullable(),
  href: z.string().min(1).max(500),
  image: z.string().max(8_000_000).optional().nullable(),
  imageOnly: z.boolean().optional().default(false),
  bgFrom: z.string().min(4).max(40),
  bgTo: z.string().min(4).max(40),
  active: z.boolean(),
  disclosureMark: z.enum(["ad", "partner"]).optional().default("ad"),
  startsAt: z.string().optional().nullable(),
  endsAt: z.string().optional().nullable(),
})

function toDate(value?: string | null) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export const GET = withAdminApi(async ({ staff, req }) => {
  try {
    const banners = await prisma.siteBanner.findMany({
      orderBy: { updatedAt: "desc" },
      take: 20,
    })

    await writeAudit({
      actorId: staff.id,
      action: AuditAction.ADMIN_SETTINGS_VIEWED,
      targetType: "SiteBanner",
      metadata: { count: banners.length },
      ip: extractIp(req),
      userAgent: extractUA(req),
    })

    return NextResponse.json({ banners })
  } catch (error) {
    console.warn("admin site-banner GET unavailable:", error)
    return NextResponse.json({ banners: [] })
  }
}, "settings.view")

export const POST = withAdminApi(async ({ staff, req }) => {
  try {
    const input = bannerSchema.parse(await req.json())

    if (input.active) {
      await prisma.siteBanner.updateMany({
        where: { id: input.id ? { not: input.id } : undefined, active: true },
        data: { active: false },
      })
    }

    const imageOnly = Boolean(input.imageOnly && input.image)
    const data = {
      title: input.title?.trim() || (imageOnly ? "Реклама" : "Баннер"),
      linkText: imageOnly ? null : input.linkText || null,
      href: input.href,
      image: input.image || null,
      imageOnly,
      bgFrom: input.bgFrom,
      bgTo: input.bgTo,
      active: input.active,
      disclosureMark: input.disclosureMark ?? "ad",
      startsAt: toDate(input.startsAt),
      endsAt: toDate(input.endsAt),
    }

    // disclosureMark is in schema but types not regenerated yet — cast until `prisma generate` runs on server
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const prismaData = data as any
    const banner = input.id
      ? await prisma.siteBanner.update({ where: { id: input.id }, data: prismaData })
      : await prisma.siteBanner.create({ data: prismaData })

    await writeAudit({
      actorId: staff.id,
      action: AuditAction.ADMIN_SETTINGS_UPDATED,
      targetType: "SiteBanner",
      targetId: banner.id,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      metadata: { active: banner.active, title: banner.title, disclosureMark: (banner as any).disclosureMark },
      ip: extractIp(req),
      userAgent: extractUA(req),
    })

    return NextResponse.json({ banner })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error("admin site-banner POST error:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}, "settings.manage")
