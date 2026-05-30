import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { requireCompanyAccess, canManageCompany } from "@/lib/business/access"
import { computeProfileCompleteness } from "@/lib/business/profile-completeness"

export const dynamic = "force-dynamic"

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const company = await prisma.company.findFirst({
    where: {
      OR: [{ id: params.id }, { publicSlug: params.id }],
    },
    include: {
      _count: { select: { listings: { where: { status: "ACTIVE" } } } },
    },
  })

  if (!company) {
    return NextResponse.json({ error: "Не найдено" }, { status: 404 })
  }

  const viewer = await getCurrentUser()
  const isStaff = viewer && ["ADMIN", "MODERATOR"].includes(viewer.role)
  const access = viewer
    ? await requireCompanyAccess(viewer.id, company.id)
    : null

  const isPublic =
    company.isPublic &&
    company.verificationStatus === "VERIFIED" &&
    !company.isBlocked

  if (!isPublic && !access && !isStaff) {
    return NextResponse.json({ error: "Не найдено" }, { status: 404 })
  }

  const publicCompany = {
    id: company.id,
    name: company.name,
    city: company.city,
    region: company.region,
    industry: company.industry,
    businessRole: company.businessRole,
    description: company.description,
    websiteUrl: company.websiteUrl,
    vkUrl: company.vkUrl,
    maxUrl: company.maxUrl,
    verificationStatus: company.verificationStatus,
    publicSlug: company.publicSlug,
    listingCount: company._count.listings,
    isVerified: company.verificationStatus === "VERIFIED",
  }

  if (access || isStaff) {
    return NextResponse.json({
      company: {
        ...publicCompany,
        inn: company.inn,
        ogrn: company.ogrn,
        contactName: company.contactName,
        contactRole: company.contactRole,
        rejectionReason: company.rejectionReason,
        isPublic: company.isPublic,
      },
      access,
    })
  }

  return NextResponse.json({ company: publicCompany })
}

const patchSchema = z.object({
  logoUrl: z.string().max(500).optional().nullable(),
  coverUrl: z.string().max(500).optional().nullable(),
  shortDescription: z.string().max(500).optional().nullable(),
  description: z.string().max(5000).optional().nullable(),
  industry: z.string().max(120).optional().nullable(),
  city: z.string().max(100).optional(),
  region: z.string().max(100).optional().nullable(),
  websiteUrl: z.string().max(300).optional().nullable(),
  vkUrl: z.string().max(300).optional().nullable(),
  maxUrl: z.string().max(300).optional().nullable(),
  paymentTerms: z.string().max(500).optional().nullable(),
  vatType: z.string().max(80).optional().nullable(),
  minOrderInfo: z.string().max(500).optional().nullable(),
  companyDeliveryRegions: z.array(z.string()).optional(),
  catalogEnabled: z.boolean().optional(),
  isPublic: z.boolean().optional(),
  showPhonePublicly: z.boolean().optional(),
  showEmailPublicly: z.boolean().optional(),
  showWebsitePublicly: z.boolean().optional(),
  showRequisitesPublicly: z.boolean().optional(),
  showDocumentsPublicly: z.boolean().optional(),
  contactName: z.string().max(120).optional(),
  contactRole: z.string().max(80).optional().nullable(),
  contactPhone: z.string().max(20).optional().nullable(),
  contactEmail: z.string().email().optional().or(z.literal("")).nullable(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 })

  const access = await requireCompanyAccess(user.id, params.id, ["OWNER", "ADMIN"])
  if (!access || !canManageCompany(access.role)) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Некорректные данные" }, { status: 400 })
  }

  const data = { ...parsed.data }
  if (data.contactEmail === "") data.contactEmail = null

  const updated = await prisma.company.update({
    where: { id: params.id },
    data,
  })

  const [activeListings, categories, publicDocs] = await Promise.all([
    prisma.businessListing.count({ where: { companyId: params.id, status: "ACTIVE" } }),
    prisma.businessCatalogCategory.count({ where: { companyId: params.id } }),
    prisma.companyDocument.count({ where: { companyId: params.id, isPublic: true } }),
  ])

  const profileCompleteness = computeProfileCompleteness(
    { ...updated, logoUrl: updated.logoUrl, coverUrl: updated.coverUrl },
    activeListings,
    categories,
    publicDocs,
  )

  await prisma.company.update({
    where: { id: params.id },
    data: { profileCompleteness },
  })

  return NextResponse.json({ company: { ...updated, profileCompleteness } })
}
