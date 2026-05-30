import { prisma } from "@/lib/prisma"
import { computeProfileCompleteness } from "@/lib/business/profile-completeness"

export function companyPublicPath(company: { publicSlug: string | null; id: string }) {
  return `/business/companies/${company.publicSlug ?? company.id}`
}

/** Публичная витрина: VERIFIED + isPublic + ≥1 активное предложение */
export async function getPublicCompanyBySlug(slug: string) {
  const company = await prisma.company.findFirst({
    where: {
      OR: [{ id: slug }, { publicSlug: slug }],
      isPublic: true,
      verificationStatus: "VERIFIED",
      isBlocked: false,
    },
    include: {
      catalogCategories: { orderBy: { sortOrder: "asc" } },
      listings: {
        where: { status: "ACTIVE" },
        orderBy: { createdAt: "desc" },
        include: { catalogCategory: { select: { id: true, title: true, slug: true } } },
      },
      documents: {
        where: { isPublic: true },
        orderBy: { createdAt: "desc" },
        select: { id: true, title: true, fileUrl: true, docType: true },
      },
      _count: { select: { listings: { where: { status: "ACTIVE" } }, inquiriesReceived: true } },
    },
  })

  if (!company || company._count.listings < 1) return null

  const reviewStats = await prisma.companyReview.aggregate({
    where: { companyId: company.id, status: "PUBLISHED" },
    _avg: { rating: true },
    _count: true,
  })

  const reviews = await prisma.companyReview.findMany({
    where: { companyId: company.id, status: "PUBLISHED" },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { author: { select: { name: true, avatar: true } } },
  })

  const publicDocuments =
    company.showDocumentsPublicly ? company.documents : []

  const profileCompleteness = computeProfileCompleteness(
    company,
    company._count.listings,
    company.catalogCategories.length,
    publicDocuments.length,
  )

  return {
    company: { ...company, documents: publicDocuments },
    profileCompleteness,
    reviews: reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
      authorName: r.author.name ?? "Пользователь",
      authorAvatar: r.author.avatar,
    })),
    reviewAverage: reviewStats._avg.rating ?? 0,
    reviewCount: reviewStats._count,
  }
}

/** Превью для владельца/сотрудника (не индексируется) */
export async function getCompanyPreviewBySlug(slug: string, userId: string) {
  const { getUserCompanyAccess } = await import("@/lib/business/access")
  const company = await prisma.company.findFirst({
    where: { OR: [{ id: slug }, { publicSlug: slug }], isBlocked: false },
    include: {
      catalogCategories: { orderBy: { sortOrder: "asc" } },
      listings: {
        where: { status: { in: ["ACTIVE", "PENDING"] } },
        orderBy: { createdAt: "desc" },
        include: { catalogCategory: { select: { id: true, title: true, slug: true } } },
      },
      _count: { select: { listings: true, inquiriesReceived: true } },
    },
  })
  if (!company) return null
  const access = await getUserCompanyAccess(userId)
  if (!access.some((a) => a.companyId === company.id)) return null
  return company
}
