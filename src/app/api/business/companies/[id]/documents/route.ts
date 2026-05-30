import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { requireCompanyAccess, canManageCompany } from "@/lib/business/access"
const createSchema = z.object({
  title: z.string().min(2).max(200),
  fileUrl: z.string().min(1).max(500),
  docType: z.enum(["CERTIFICATE", "LICENSE", "PRICE_LIST", "PRESENTATION", "OTHER"]).default("OTHER"),
  isPublic: z.boolean().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const publicOnly = request.nextUrl.searchParams.get("public") === "1"
  const company = await prisma.company.findUnique({
    where: { id: params.id },
    select: { showDocumentsPublicly: true, verificationStatus: true, isPublic: true },
  })
  if (!company) return NextResponse.json({ error: "Не найдено" }, { status: 404 })

  if (publicOnly) {
    if (!company.showDocumentsPublicly || company.verificationStatus !== "VERIFIED" || !company.isPublic) {
      return NextResponse.json({ items: [] })
    }
    const items = await prisma.companyDocument.findMany({
      where: { companyId: params.id, isPublic: true },
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, fileUrl: true, docType: true, createdAt: true },
    })
    return NextResponse.json({ items })
  }

  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 })
  const access = await requireCompanyAccess(user.id, params.id)
  if (!access) return NextResponse.json({ error: "Нет доступа" }, { status: 403 })

  const items = await prisma.companyDocument.findMany({
    where: { companyId: params.id },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json({ items })
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 })

  const access = await requireCompanyAccess(user.id, params.id, ["OWNER", "ADMIN"])
  if (!access || !canManageCompany(access.role)) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 })
  }

  const count = await prisma.companyDocument.count({ where: { companyId: params.id } })
  if (count >= 20) {
    return NextResponse.json({ error: "Лимит документов (20)" }, { status: 403 })
  }

  const data = createSchema.parse(await request.json())
  const doc = await prisma.companyDocument.create({
    data: {
      companyId: params.id,
      title: data.title.trim(),
      fileUrl: data.fileUrl,
      docType: data.docType,
      isPublic: data.isPublic ?? false,
    },
  })
  return NextResponse.json({ document: doc }, { status: 201 })
}
