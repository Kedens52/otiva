import { prisma } from "@/lib/prisma"
import { getListingPublicPath } from "@/lib/seo/paths"
import { SITE_URL } from "@/lib/seo/site"
import { topicBreadcrumbLabels } from "@/lib/support/topics"

export type SupportTicketContext = {
  topicLabel: string | null
  subtopicLabel: string | null
  listing: {
    id: string
    title: string
    price: number
    currency: string
    city: string | null
    status: string
    rejectionReason: string | null
    moderationReasonCode: string | null
    image: string | null
    categoryName: string | null
    createdAt: string
    publicUrl: string
    adminUrl: string
    promotions: string[]
  } | null
  adCampaign: {
    id: string
    title: string
    status: string
    type: string
    budget: number | null
    spent: number
    startDate: string | null
    moderationNote: string | null
    profileAdsUrl: string
    adminHint: string
  } | null
  business: {
    company: { id: string; name: string; status: string; publicUrl: string } | null
    listing: { id: string; title: string; status: string; url: string } | null
    request: { id: string; title: string; status: string } | null
  } | null
  client: {
    id: string
    name: string | null
    phone: string | null
    email: string | null
    createdAt: string
    profileUrl: string
    adminUrl: string
  } | null
}

function formatRub(price: number, currency: string) {
  if (currency === "RUB") return `${price.toLocaleString("ru-RU")} ₽`
  return `${price} ${currency}`
}

function listingPromotions(listing: {
  isPromoted: boolean
  promotedUntil: Date | null
  highlightedUntil: Date | null
  recommendedUntil: Date | null
  autoboostUntil: Date | null
  pinnedUntil: Date | null
}) {
  const items: string[] = []
  if (listing.isPromoted) items.push("Продвижение")
  if (listing.highlightedUntil && listing.highlightedUntil > new Date()) items.push("Выделение")
  if (listing.recommendedUntil && listing.recommendedUntil > new Date()) items.push("Рекомендации")
  if (listing.autoboostUntil && listing.autoboostUntil > new Date()) items.push("Автоподъём")
  if (listing.pinnedUntil && listing.pinnedUntil > new Date()) items.push("Закрепление")
  return items
}

export async function loadSupportTicketContext(input: {
  conversationId: string
  supportTopic: string | null
  supportSubtopic: string | null
  supportListingId: string | null
  supportAdCampaignId: string | null
  listingId: string | null
  companyId: string | null
  businessListingId: string | null
  businessRequestId: string | null
  clientUserId: string | null
  canViewSensitive: boolean
}): Promise<SupportTicketContext> {
  const breadcrumb = topicBreadcrumbLabels(input.supportTopic ?? undefined, input.supportSubtopic ?? undefined)
  const base = SITE_URL.replace(/\/$/, "")

  const listingId = input.supportListingId || input.listingId
  let listing: SupportTicketContext["listing"] = null

  if (listingId) {
    const row = await prisma.listing.findUnique({
      where: { id: listingId },
      select: {
        id: true,
        title: true,
        slug: true,
        price: true,
        currency: true,
        city: true,
        status: true,
        images: true,
        rejectionReason: true,
        moderationReasonCode: true,
        createdAt: true,
        isPromoted: true,
        promotedUntil: true,
        highlightedUntil: true,
        recommendedUntil: true,
        autoboostUntil: true,
        pinnedUntil: true,
        category: { select: { name: true } },
      },
    })
    if (row) {
      const path = getListingPublicPath(row)
      listing = {
        id: row.id,
        title: row.title,
        price: row.price,
        currency: row.currency,
        city: row.city,
        status: row.status,
        rejectionReason: row.rejectionReason,
        moderationReasonCode: row.moderationReasonCode,
        image: row.images[0] ?? null,
        categoryName: row.category?.name ?? null,
        createdAt: row.createdAt.toISOString(),
        publicUrl: `${base}${path}`,
        adminUrl: `/admin/listings/${row.id}`,
        promotions: listingPromotions(row),
      }
    }
  }

  let adCampaign: SupportTicketContext["adCampaign"] = null
  if (input.supportAdCampaignId) {
    const ad = await prisma.adCampaign.findUnique({
      where: { id: input.supportAdCampaignId },
      select: {
        id: true,
        title: true,
        status: true,
        type: true,
        budget: true,
        spent: true,
        startDate: true,
        moderationNote: true,
      },
    })
    if (ad) {
      adCampaign = {
        id: ad.id,
        title: ad.title,
        status: ad.status,
        type: ad.type,
        budget: ad.budget,
        spent: ad.spent,
        startDate: ad.startDate?.toISOString() ?? null,
        moderationNote: ad.moderationNote,
        profileAdsUrl: "/profile/ads",
        adminHint: `Кампания ${ad.id}`,
      }
    }
  }

  let business: SupportTicketContext["business"] = null
  if (input.companyId || input.businessListingId || input.businessRequestId) {
    const [company, bListing, bRequest] = await Promise.all([
      input.companyId
        ? prisma.company.findUnique({
            where: { id: input.companyId },
            select: { id: true, name: true, verificationStatus: true, publicSlug: true },
          })
        : null,
      input.businessListingId
        ? prisma.businessListing.findUnique({
            where: { id: input.businessListingId },
            select: { id: true, title: true, status: true, slug: true, companyId: true },
          })
        : null,
      input.businessRequestId
        ? prisma.businessRequest.findUnique({
            where: { id: input.businessRequestId },
            select: { id: true, title: true, status: true },
          })
        : null,
    ])

    business = {
      company: company
        ? {
            id: company.id,
            name: company.name,
            status: company.verificationStatus,
            publicUrl: `/business/companies/${company.publicSlug ?? company.id}`,
          }
        : null,
      listing: bListing
        ? {
            id: bListing.id,
            title: bListing.title,
            status: bListing.status,
            url: `/business/listings/${bListing.slug ?? bListing.id}`,
          }
        : null,
      request: bRequest
        ? { id: bRequest.id, title: bRequest.title, status: bRequest.status }
        : null,
    }
  }

  let client: SupportTicketContext["client"] = null
  if (input.clientUserId) {
    const user = await prisma.user.findUnique({
      where: { id: input.clientUserId },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        createdAt: true,
        publicSlug: true,
      },
    })
    if (user) {
      client = {
        id: user.id,
        name: user.name,
        phone: input.canViewSensitive ? user.phone : null,
        email: input.canViewSensitive ? user.email : null,
        createdAt: user.createdAt.toISOString(),
        profileUrl: user.publicSlug ? `/seller/${user.publicSlug}` : `/profile/${user.id}`,
        adminUrl: `/admin/users/${user.id}`,
      }
    }
  }

  return {
    topicLabel: breadcrumb[0] ?? null,
    subtopicLabel: breadcrumb[1] ?? null,
    listing,
    adCampaign,
    business,
    client,
  }
}
