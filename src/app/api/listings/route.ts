import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { validateCategoryAttributes } from '@/lib/validators/categoryAttributes'
import { moderateListing } from '@/lib/listing-moderation'
import { syncUserTrustSnapshot, maxFreeListingsForTier, needsModerationForHighRisk } from '@/lib/trust-tier'
import { getListings } from '@/lib/listings/get-listings'

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
  lat: z.number().optional(),
  lng: z.number().optional(),
  attributes: z.record(z.unknown()).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const data = await getListings(prisma, request.nextUrl.searchParams, {
      currentUserId: user?.id ?? null,
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
        { error: 'Для безопасности это действие требует дополнительной проверки.' },
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

    const verdict = moderateListing({
      title: data.title,
      description: data.description,
      price: data.price,
      images: data.images,
      categorySlug: data.categorySlug,
      user,
    })

    const dupCount = await prisma.listing.count({
      where: {
        sellerId: user.id,
        title: { equals: data.title.trim(), mode: 'insensitive' },
        status: { notIn: ['ARCHIVED', 'SOLD'] },
      },
    })
    let finalStatus = verdict.status
    let finalReason = verdict.status === 'REJECTED' ? verdict.reason : verdict.status === 'MODERATION' ? verdict.reason : null
    let moderationCode: string | null = null
    if (dupCount > 0 && finalStatus === 'ACTIVE') {
      finalStatus = 'MODERATION'
      finalReason = 'Дублирующее объявление'
      moderationCode = 'DUPLICATE_LISTING'
    }

    if (
      data.categorySlug === 'cars' &&
      data.price > 0 &&
      data.price < 25_000 &&
      finalStatus === 'ACTIVE'
    ) {
      finalStatus = 'MODERATION'
      finalReason = finalReason
        ? `${finalReason} Цена заметно ниже типичного диапазона для категории — проверьте корректность.`
        : 'Цена заметно ниже типичного диапазона для категории; объявление отправлено на проверку.'
      moderationCode = moderationCode ?? 'INCORRECT_PRICE'
    }

    const statusBeforeTier = finalStatus
    finalStatus = needsModerationForHighRisk(trustState.trustTier, finalStatus)
    if (statusBeforeTier === 'ACTIVE' && finalStatus === 'MODERATION') {
      const suffix = 'Для безопасности объявление отправлено на проверку.'
      const prev = finalReason ? String(finalReason) : ''
      finalReason = prev.includes('Для безопасности') ? prev : prev ? `${prev} ${suffix}` : suffix
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
        lat: data.lat,
        lng: data.lng,
        attributes: data.attributes as Prisma.InputJsonValue | undefined,
        status: finalStatus,
        autoApproved: verdict.autoApproved && finalStatus === 'ACTIVE',
        rejectionReason: finalStatus === 'ACTIVE' ? null : finalReason,
        moderationReasonCode: moderationCode,
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

    void syncUserTrustSnapshot(user.id)

    return NextResponse.json({ listing, moderation: { ...verdict, status: finalStatus, reason: finalReason } }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error('listings POST error:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
