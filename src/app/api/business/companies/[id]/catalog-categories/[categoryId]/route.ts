import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { requireCompanyAccess, canManageCompany } from "@/lib/business/access"

const patchSchema = z.object({
  title: z.string().min(2).max(120).optional(),
  description: z.string().max(500).optional().nullable(),
  sortOrder: z.number().int().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; categoryId: string } },
) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 })

  const access = await requireCompanyAccess(user.id, params.id, ["OWNER", "ADMIN", "MANAGER"])
  if (!access || !canManageCompany(access.role)) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 })
  }

  const data = patchSchema.parse(await request.json())
  const cat = await prisma.businessCatalogCategory.update({
    where: { id: params.categoryId, companyId: params.id },
    data,
  })
  return NextResponse.json({ category: cat })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string; categoryId: string } },
) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 })

  const access = await requireCompanyAccess(user.id, params.id, ["OWNER", "ADMIN"])
  if (!access || !canManageCompany(access.role)) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 })
  }

  await prisma.businessListing.updateMany({
    where: { catalogCategoryId: params.categoryId },
    data: { catalogCategoryId: null },
  })
  await prisma.businessCatalogCategory.delete({
    where: { id: params.categoryId, companyId: params.id },
  })
  return NextResponse.json({ ok: true })
}
