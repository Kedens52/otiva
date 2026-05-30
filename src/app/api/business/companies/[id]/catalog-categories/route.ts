import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { requireCompanyAccess, canManageCompany } from "@/lib/business/access"
import { slugifyCompanyName } from "@/lib/business/validation"

const createSchema = z.object({
  title: z.string().min(2).max(120),
  description: z.string().max(500).optional(),
})

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const items = await prisma.businessCatalogCategory.findMany({
    where: { companyId: params.id },
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { listings: true } } },
  })
  return NextResponse.json({ items })
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 })

  const access = await requireCompanyAccess(user.id, params.id, ["OWNER", "ADMIN", "MANAGER"])
  if (!access || !canManageCompany(access.role)) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 })
  }

  const data = createSchema.parse(await request.json())
  let slug = slugifyCompanyName(data.title) || "section"
  const existing = await prisma.businessCatalogCategory.count({ where: { companyId: params.id, slug } })
  if (existing) slug = `${slug}-${Date.now().toString(36).slice(-4)}`

  const maxOrder = await prisma.businessCatalogCategory.aggregate({
    where: { companyId: params.id },
    _max: { sortOrder: true },
  })

  const cat = await prisma.businessCatalogCategory.create({
    data: {
      companyId: params.id,
      title: data.title.trim(),
      slug,
      description: data.description?.trim(),
      sortOrder: (maxOrder._max.sortOrder ?? 0) + 1,
    },
  })

  return NextResponse.json({ category: cat }, { status: 201 })
}
