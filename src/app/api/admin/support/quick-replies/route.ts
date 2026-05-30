import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { withAdminApi } from "@/lib/admin/guards"
import { hasAdminPermission } from "@/lib/admin/permissions"
import { ensureDefaultOperatorQuickReplies } from "@/lib/admin/support-quick-replies-db"
import { SUPPORT_QUICK_REPLY_CATEGORIES } from "@/lib/support/operator-quick-replies"

export const dynamic = "force-dynamic"

const upsertSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(1).max(120),
  category: z.string().trim().min(1).max(40),
  body: z.string().trim().min(1).max(8000),
  tags: z.array(z.string().max(40)).optional().default([]),
  active: z.boolean().optional().default(true),
  sortOrder: z.number().int().optional().default(0),
  isFavorite: z.boolean().optional().default(false),
})

export const GET = withAdminApi(async ({ staff }) => {
  try {
    await ensureDefaultOperatorQuickReplies()

    const items = await prisma.supportOperatorQuickReply.findMany({
      orderBy: [{ isFavorite: "desc" }, { sortOrder: "asc" }, { title: "asc" }],
    })

    return NextResponse.json({
      items,
      categories: SUPPORT_QUICK_REPLY_CATEGORIES,
      canManage: hasAdminPermission(staff, "support.quickReplies.manage"),
    })
  } catch (error) {
    console.error("admin support quick-replies GET error:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}, "support.view")

export const POST = withAdminApi(async ({ staff, req }) => {
  if (!hasAdminPermission(staff, "support.quickReplies.manage")) {
    return NextResponse.json({ error: "Нет прав на управление шаблонами" }, { status: 403 })
  }

  try {
    const body = upsertSchema.parse(await req.json())
    const item = await prisma.supportOperatorQuickReply.create({
      data: {
        title: body.title,
        category: body.category,
        body: body.body,
        tags: body.tags,
        active: body.active,
        sortOrder: body.sortOrder,
        isFavorite: body.isFavorite,
        createdByStaffId: staff.id,
        updatedByStaffId: staff.id,
      },
    })
    return NextResponse.json({ item }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error("admin support quick-replies POST error:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}, "support.view")

export const PATCH = withAdminApi(async ({ staff, req }) => {
  if (!hasAdminPermission(staff, "support.quickReplies.manage")) {
    return NextResponse.json({ error: "Нет прав на управление шаблонами" }, { status: 403 })
  }

  try {
    const body = upsertSchema.extend({ id: z.string().min(1) }).parse(await req.json())
    const item = await prisma.supportOperatorQuickReply.update({
      where: { id: body.id },
      data: {
        title: body.title,
        category: body.category,
        body: body.body,
        tags: body.tags,
        active: body.active,
        sortOrder: body.sortOrder,
        isFavorite: body.isFavorite,
        updatedByStaffId: staff.id,
      },
    })
    return NextResponse.json({ item })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error("admin support quick-replies PATCH error:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}, "support.view")

export const DELETE = withAdminApi(async ({ staff, req }) => {
  if (!hasAdminPermission(staff, "support.quickReplies.manage")) {
    return NextResponse.json({ error: "Нет прав на управление шаблонами" }, { status: 403 })
  }

  const id = new URL(req.url).searchParams.get("id")?.trim()
  if (!id) {
    return NextResponse.json({ error: "Укажите id" }, { status: 400 })
  }

  try {
    await prisma.supportOperatorQuickReply.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("admin support quick-replies DELETE error:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}, "support.view")
