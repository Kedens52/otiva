import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { validateCategoryAttributes } from '@/lib/validators/categoryAttributes'
import {
  evaluateListingContent,
  notifyListingContentIncident,
} from '@/lib/content-policy/listing-flow'
import { syncUserTrustSnapshot, maxFreeListingsForTier, needsModerationForHighRisk } from '@/lib/trust-tier'
import { getListings } from '@/lib/listings/get-listings'
import { getAdminSession } from '@/lib/admin/adminSession'
import { toPublicSellerContact } from '@/lib/phone-privacy'
import { syncListingSlug } from '@/lib/seo/sync-listing-slug'
import { notifyListingSearchIndex } from '@/lib/seo/notify-search-index'
import { getMarketPriceEstimate } from '@/lib/market-price/service'
import { persistListingPriceInsight, shouldFlagLowPriceForModeration } from '@/lib/market-price/persist'

export const dynamic = 'force-dynamic'

const createSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().min(10).max(3000),
  price: z.number().min(0).max(1_000_000_000),
  categorySlug: z.string(),
  images: z.array(z.string()).max(10).default([]),
  video: z.string().max(500).optional(),
  location: z.string().max(300).optional(),
  city: z.string().max(100).optional(),
  district: z.string().max(120).optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  showExactAddress: z.boolean().optional(),
  attributes: z.record(z.unknown()).optional(),
  priceAnomalyReason: z.string().max(120).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const explainParam = request.nextUrl.searchParams.get('explainRanking') === '1'
    const adminSession = explainParam ? await getAdminSession() : null
    const data = await getListings(prisma, request.nextUrl.searchParams, {
      currentUserId: user?.id ?? null,
      explainRanking: explainParam && Boolean(adminSession?.staff),
    })
    return NextResponse.json(data)
  } catch (error) {
    console.error('listings GET error:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const body = await request.json()
    const data = createSchema.parse(body)
    if (!data.city?.trim()) {
      return NextResponse.json({ error: 'Укажите город' }, { status: 400 })
    }

    const attributesValidation = validateCategoryAttributes(
      data.categorySlug,
      data.attributes as Record<string, unknown> | undefined,
    )
    if (!attributesValidation.ok) {
      return NextResponse.json({ error: attributesValidation.error }, { status: 400 })
    }

    const category = await prisma.category.findUnique({
      where: { slug: data.categorySlug },
    })

    if (!category) {
      return NextResponse.json({ error: 'Категория не найдена' }, { status: 400 })
    }

    const trustState = await prisma.user.findUnique({
      where: { id: user.id },
      select: { trustTier: true, accountRestricted: true },
    })
    if (!trustState) {
      return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
    }
    if (trustState.accountRestricted) {
      return NextResponse.json(
        { error: 'По правилам сервиса это действие требует дополнительной проверки.' },
        { status: 403 },
      )
    }
    const maxActive = maxFreeListingsForTier(trustState.trustTier)
    const activeCount = await prisma.listing.count({
      where: { sellerId: user.id, status: { in: ['ACTIVE', 'MODERATION'] } },
    })
    if (activeCount >= maxActive) {
      return NextResponse.json(
        { error: 'Достигнут лимит активных объявлений. Завершите или архивируйте объявления либо выберите тариф.' },
        { status: 403 },
      )
    }

    const contentEval = await evaluateListingContent(prisma, {
      title: data.title,
      description: data.description,
      price: data.price,
      images: data.images,
      categorySlug: data.categorySlug,
      user: { id: user.id, isBanned: user.isBanned, isVerified: user.isVerified },
      request,
    })

    let finalStatus = contentEval.finalStatus
    let finalReason = contentEval.finalReason
    let moderationCode = contentEval.moderationCode
    const verdict = contentEval.verdict

    const marketEstimate =
      data.price > 0
        ? await getMarketPriceEstimate({
            categorySlug: data.categorySlug,
            price: data.price,
            city: data.city,
            attributes: data.attributes as Record<string, unknown> | undefined,
          }).catch(() => null)
        : null

    if (marketEstimate && shouldFlagLowPriceForModeration(marketEstimate) && finalStatus === 'ACTIVE') {
      finalStatus = 'MODERATION'
      finalReason = finalReason
        ? `${finalReason} Цена заметно ниже рынка по похожим объявлениям — проверьте корректность.`
        : 'Цена заметно ниже рынка по похожим объявлениям; объявление отправлено на проверку.'
      moderationCode = moderationCode ?? 'LOW_PRICE_MARKET'
    }

    const statusBeforeTier = finalStatus
    finalStatus = needsModerationForHighRisk(trustState.trustTier, finalStatus)
    if (statusBeforeTier === 'ACTIVE' && finalStatus === 'MODERATION') {
      const suffix = 'По правилам сервиса объявление отправлено на проверку.'
      const prev = finalReason ? String(finalReason) : ''
      finalReason = prev.includes('По правилам сервиса') ? prev : prev ? `${prev} ${suffix}` : suffix
    }

    const listing = await prisma.listing.create({
      data: {
        title: data.title,
        description: data.description,
        price: data.price,
        images: data.images,
        video: data.video,
        location: data.location,
        city: data.city,
        district: data.district,
        lat: data.lat,
        lng: data.lng,
        showExactAddress: data.showExactAddress ?? false,
        attributes: data.attributes as Prisma.InputJsonValue | undefined,
        status: finalStatus,
        autoApproved: verdict.autoApproved && finalStatus === 'ACTIVE',
        rejectionReason: finalStatus === 'ACTIVE' ? null : finalReason,
        moderationReasonCode: moderationCode,
        contentFingerprint: contentEval.contentFingerprint,
        returnedForRevision: false,
        categoryId: category.id,
        sellerId: user.id,
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

    if (finalStatus === 'REJECTED') {
      await prisma.moderationLog.create({
        data: {
          listingId: listing.id,
          action: "REJECTED",
          reason: finalReason,
        },
      }).catch(console.error)
    }

    void notifyListingContentIncident({
      title: data.title,
      description: data.description,
      price: data.price,
      images: data.images,
      categorySlug: data.categorySlug,
      user: { id: user.id, isBanned: user.isBanned, isVerified: user.isVerified },
      evaluation: contentEval,
      listingId: listing.id,
      request,
    })

    if (marketEstimate && data.price > 0) {
      void persistListingPriceInsight(listing.id, marketEstimate, data.priceAnomalyReason).catch(console.error)
    }

    void syncUserTrustSnapshot(user.id)
    void syncListingSlug(listing.id).catch(() => {})
    if (finalStatus === "ACTIVE") {
      const { tryListingBonuses } = await import("@/lib/bonuses/hooks")
      void tryListingBonuses(listing, prisma).catch(() => {})
      void notifyListingSearchIndex(listing.id)
    }

    const publicSeller = listing.seller
      ? toPublicSellerContact(listing.seller, user.id)
      : undefined

    return NextResponse.json({
      listing: { ...listing, seller: publicSeller },
      moderation: { ...verdict, status: finalStatus, reason: finalReason },
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error('listings POST error:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
