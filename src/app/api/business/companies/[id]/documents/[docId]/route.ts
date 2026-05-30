import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { requireCompanyAccess, canManageCompany } from "@/lib/business/access"

const patchSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  isPublic: z.boolean().optional(),
  docType: z.enum(["CERTIFICATE", "LICENSE", "PRICE_LIST", "PRESENTATION", "OTHER"]).optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; docId: string } },
) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 })

  const access = await requireCompanyAccess(user.id, params.id, ["OWNER", "ADMIN"])
  if (!access || !canManageCompany(access.role)) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 })
  }

  const data = patchSchema.parse(await request.json())
  const doc = await prisma.companyDocument.update({
    where: { id: params.docId, companyId: params.id },
    data,
  })
  return NextResponse.json({ document: doc })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string; docId: string } },
) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 })

  const access = await requireCompanyAccess(user.id, params.id, ["OWNER", "ADMIN"])
  if (!access || !canManageCompany(access.role)) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 })
  }

  await prisma.companyDocument.delete({ where: { id: params.docId, companyId: params.id } })
  return NextResponse.json({ ok: true })
}
