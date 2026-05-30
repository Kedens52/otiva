import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { deleteUploadFiles, deleteRemovedFiles } from '@/lib/upload-cleanup'
import {
  evaluateListingContent,
  notifyListingContentIncident,
} from '@/lib/content-policy/listing-flow'
import { syncUserTrustSnapshot, needsModerationForHighRisk } from '@/lib/trust-tier'
import { toPublicSellerContact } from '@/lib/phone-privacy'
import { buildPublicLocation, labelSellerRole } from '@/lib/profile/public-fields'
import { profileTypeLabel } from '@/lib/profile-hub'
import { getPublicUserBadges } from '@/lib/badges/get-public-badges'
import { findListingByRouteParam } from '@/lib/listings/resolve-listing-route'
import { LISTING_PUBLIC_LIST_INCLUDE } from '@/lib/listings/get-listings'
import { getMarketPriceEstimate } from '@/lib/market-price/service'
import { getPriceWarning } from '@/lib/market-price/messages'
import { persistListingPriceInsight, shouldFlagLowPriceForModeration } from '@/lib/market-price/persist'
import { syncListingSlug } from '@/lib/seo/sync-listing-slug'
import { notifyListingSearchIndex } from '@/lib/seo/notify-search-index'

function viewFingerprint(req: NextRequest): string {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? req.headers.get("x-real-ip")
    ?? "unknown"
  const ua = req.headers.get("user-agent") ?? ""
  return createHash("sha256").update(ip + ua).digest("hex").slice(0, 16)
}

export const dynamic = 'force-dynamic'

const updateSchema = z.object({
  title: z.string().min(3).max(100).optional(),
  description: z.string().min(10).max(3000).optional(),
  price: z.number().min(0).max(1_000_000_000).optional(),
  images: z.array(z.string()).max(10).optional(),
  video: z.string().max(500).optional().nullable(),
  location: z.string().max(300).optional(),
  city: z.string().max(100).optional(),
  district: z.string().max(120).optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  showExactAddress: z.boolean().optional(),
  attributes: z.record(z.unknown()).optional(),
  status: z.enum(['ACTIVE', 'SOLD', 'ARCHIVED']).optional(),
  priceAnomalyReason: z.string().max(120).optional(),
})

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const listing = await findListingByRouteParam(prisma, params.id, {
      priceInsight: true,
      seller: {
        select: {
          id: true,
          name: true,
          avatar: true,
          phone: true,
          showPhone: true,
          rating: true,
          reviewCount: true,
          isVerified: true,
          createdAt: true,
          lastSeenAt: true,
          publicSlug: true,
          profileHeadline: true,
          city: true,
          district: true,
          profileType: true,
          sellerRole: true,
          companyName: true,
          showCityPublicly: true,
          showDistrictPublicly: true,
          showBadgesPublicly: true,
          avgResponseMinutes: true,
        },
      },
      category: true,
      _count: { select: { favorites: true } },
    })

    if (!listing) {
      return NextResponse.json({ error: 'Объявление не найдено' }, { status: 404 })
    }

    const viewer = await getCurrentUser()
    const isOwner = viewer?.id === listing.sellerId
    const isStaff = Boolean(viewer && ['ADMIN', 'MODERATOR'].includes(viewer.role))
    const isPublicStatus = listing.status === 'ACTIVE' || listing.status === 'SOLD'

    if (!isPublicStatus && !isOwner && !isStaff) {
      return NextResponse.json({ error: 'Объявление не найдено' }, { status: 404 })
    }

    const listingId = listing.id

    prisma.listing.update({
      where: { id: listingId },
      data: { views: { increment: 1 } },
    }).catch(console.error)

    const fp = viewFingerprint(_request)
    prisma.listingView.create({
      data: { listingId, fingerprint: fp },
    }).then(() => prisma.listing.update({
      where: { id: listingId },
      data: { uniqueViews: { increment: 1 } },
    })).catch((error) => {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return
      console.error(error)
    })

    let badges: Awaited<ReturnType<typeof getPublicUserBadges>> = []
    if (listing.seller && listing.seller.showBadgesPublicly !== false) {
      try {
        badges = await getPublicUserBadges(listing.seller.id)
      } catch (badgeError) {
        console.error("[listing] badges load failed:", badgeError)
      }
    }
    const publicSeller = listing.seller
      ? {
          ...toPublicSellerContact(listing.seller, viewer?.id),
          badges,
          profileHeadline: listing.seller.profileHeadline,
          profileTypeLabel: profileTypeLabel(
            listing.seller.profileType === "COMPANY" ? "COMPANY" : "PERSON",
          ),
          sellerRoleLabel: labelSellerRole(listing.seller.sellerRole),
          companyName: listing.seller.companyName,
          locationLabel: buildPublicLocation(listing.seller),
          avgResponseMinutes: listing.seller.avgResponseMinutes,
        }
      : undefined

    const sellerOtherListings =
      isPublicStatus && listing.sellerId
        ? await prisma.listing.findMany({
            where: {
              sellerId: listing.sellerId,
              status: "ACTIVE",
              id: { not: listingId },
            },
            take: 6,
            orderBy: { createdAt: "desc" },
            include: LISTING_PUBLIC_LIST_INCLUDE,
          })
        : []

    const publicSellerOther = sellerOtherListings.map((item) => ({
      ...item,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
      seller: item.seller
        ? {
            ...toPublicSellerContact(item.seller, viewer?.id),
          }
        : item.seller,
    }))

    const categorySlug =
      typeof listing.category === "object" && listing.category && "slug" in listing.category
        ? String(listing.category.slug)
        : ""
    const buyerHint = listing.priceInsight
      ? getPriceWarning(listing.priceInsight.status, categorySlug).buyerHint
      : null

    return NextResponse.json({
      listing: { ...listing, seller: publicSeller, priceInsight: listing.priceInsight, buyerPriceHint: buyerHint },
      sellerOtherListings: publicSellerOther,
    })
  } catch (error) {
    console.error('listing GET error:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const listing = await findListingByRouteParam(prisma, params.id)
    if (!listing) {
      return NextResponse.json({ error: 'Не найдено' }, { status: 404 })
    }
    const listingId = listing.id

    const isOwner = listing.sellerId === user.id
    const isAdmin = ['ADMIN', 'MODERATOR'].includes(user.role)

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Нет доступа' }, { status: 403 })
    }

    const body = await request.json()
    const data = updateSchema.parse(body)

    if (!isAdmin && data.status === 'ACTIVE') {
      delete data.status
    }

    let moderationUpdate: Record<string, unknown> = {}

    if (
      isOwner &&
      listing.status === 'ACTIVE' &&
      data.price !== undefined &&
      data.price > 0
    ) {
      const category = await prisma.category.findUnique({
        where: { id: listing.categoryId },
        select: { slug: true },
      })
      if (category?.slug) {
        const marketEstimate = await getMarketPriceEstimate({
          categorySlug: category.slug,
          price: data.price,
          city: data.city ?? listing.city ?? undefined,
          attributes: (data.attributes ?? listing.attributes) as Record<string, unknown> | undefined,
          excludeListingId: listingId,
        }).catch(() => null)
        if (marketEstimate && shouldFlagLowPriceForModeration(marketEstimate)) {
          moderationUpdate = {
            status: 'MODERATION',
            autoApproved: false,
            rejectionReason:
              'Цена заметно ниже рынка по похожим объявлениям; объявление отправлено на проверку.',
            returnedForRevision: false,
            moderationReasonCode: 'LOW_PRICE_MARKET',
          }
        }
      }
    }

    const textOrMediaChanged =
      data.title != null || data.description != null || data.images != null

    if (isOwner && (listing.status === 'MODERATION' || listing.status === 'REJECTED' || textOrMediaChanged)) {
      const [category, seller] = await Promise.all([
        prisma.category.findUnique({ where: { id: listing.categoryId }, select: { slug: true } }),
        prisma.user.findUnique({ where: { id: listing.sellerId }, select: { isBanned: true, trustTier: true } }),
      ])
      const title = data.title ?? listing.title
      const description = data.description ?? listing.description
      const price = data.price ?? listing.price
      const images = data.images ?? listing.images

      const contentEval = await evaluateListingContent(prisma, {
        title,
        description,
        price,
        images,
        categorySlug: category?.slug,
        user: { id: listing.sellerId, isBanned: seller?.isBanned },
        excludeListingId: listingId,
        request,
      })

      let finalStatus = contentEval.finalStatus
      let finalReason = contentEval.finalReason
      let moderationCode = contentEval.moderationCode
      const statusBeforeTier = finalStatus
      finalStatus = needsModerationForHighRisk(seller?.trustTier ?? "NORMAL", finalStatus)
      if (statusBeforeTier === 'ACTIVE' && finalStatus === 'MODERATION') {
        const suffix = 'По правилам сервиса объявление отправлено на проверку.'
        const prev = finalReason ? String(finalReason) : ''
        finalReason = prev.includes('По правилам сервиса') ? prev : prev ? `${prev} ${suffix}` : suffix
      }
      let lowPriceFlag = false
      if (category?.slug && price > 0) {
        const marketEstimate = await getMarketPriceEstimate({
          categorySlug: category.slug,
          price,
          city: data.city ?? listing.city ?? undefined,
          attributes: (data.attributes ?? listing.attributes) as Record<string, unknown> | undefined,
          excludeListingId: listingId,
        }).catch(() => null)
        if (marketEstimate && shouldFlagLowPriceForModeration(marketEstimate) && finalStatus === 'ACTIVE') {
          finalStatus = 'MODERATION'
          finalReason = finalReason
            ? `${finalReason} Цена заметно ниже рынка.`
            : 'Цена заметно ниже рынка; объявление отправлено на проверку.'
          lowPriceFlag = true
        }
      }

      if (listing.status === 'ACTIVE' && finalStatus === 'ACTIVE') {
        moderationUpdate = {
          contentFingerprint: contentEval.contentFingerprint,
        }
      } else {
        moderationUpdate = {
          status: finalStatus,
          autoApproved: contentEval.verdict.autoApproved && finalStatus === 'ACTIVE',
          rejectionReason: finalStatus === 'ACTIVE' ? null : finalReason,
          returnedForRevision: false,
          moderationReasonCode:
            finalStatus === 'ACTIVE'
              ? null
              : lowPriceFlag
                ? 'LOW_PRICE_MARKET'
                : moderationCode ?? listing.moderationReasonCode,
          contentFingerprint: contentEval.contentFingerprint,
        }
      }

      void notifyListingContentIncident({
        title,
        description,
        price,
        images,
        categorySlug: category?.slug,
        user: { id: listing.sellerId, isBanned: seller?.isBanned },
        evaluation: contentEval,
        listingId,
        request,
      })
    }

    const updated = await prisma.listing.update({
      where: { id: listingId },
      data: {
        ...data,
        ...moderationUpdate,
        attributes: data.attributes as Prisma.InputJsonValue | undefined,
      },
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            avatar: true,
            phone: true,
            showPhone: true,
            rating: true,
            reviewCount: true,
            isVerified: true,
          },
        },
        category: true,
      },
    })

    await deleteRemovedFiles(
      listing.images,
      updated.images,
      listing.video,
      updated.video,
    ).catch(console.error)

    const priceForInsight = data.price ?? listing.price
    if (priceForInsight > 0 && updated.category?.slug) {
      const catSlug = updated.category.slug
      if (catSlug) {
        const estimate = await getMarketPriceEstimate({
          categorySlug: catSlug,
          price: priceForInsight,
          city: updated.city ?? undefined,
          attributes: updated.attributes as Record<string, unknown> | undefined,
          excludeListingId: listingId,
        }).catch(() => null)
        if (estimate) {
          await persistListingPriceInsight(listingId, estimate, data.priceAnomalyReason).catch(console.error)
        }
      }
    }

    void syncUserTrustSnapshot(listing.sellerId)

    if (
      data.title !== undefined ||
      data.city !== undefined ||
      data.description !== undefined
    ) {
      void syncListingSlug(listingId).catch(() => {})
    }

    if (updated.status === "ACTIVE") {
      void notifyListingSearchIndex(listingId)
    }

    const publicSeller = updated.seller
      ? toPublicSellerContact(updated.seller, user.id)
      : undefined

    return NextResponse.json({
      listing: { ...updated, seller: publicSeller },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const listing = await findListingByRouteParam(prisma, params.id)
    if (!listing) {
      return NextResponse.json({ error: 'Не найдено' }, { status: 404 })
    }

    const isOwner = listing.sellerId === user.id
    const isAdmin = ['ADMIN', 'MODERATOR'].includes(user.role)

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Нет доступа' }, { status: 403 })
    }

    await prisma.listing.delete({ where: { id: listing.id } })

    const filesToDelete = [
      ...listing.images,
      ...(listing.video ? [listing.video] : []),
    ]
    await deleteUploadFiles(filesToDelete).catch(console.error)

    return NextResponse.json({ message: 'Удалено' })
  } catch {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
