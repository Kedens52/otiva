import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getProfileTrust } from '@/lib/profile-trust'
import { getPublicUserBadges } from '@/lib/badges/get-public-badges'
import { PROFILE_SELECT_PUBLIC, toPublicSellerProfile } from '@/lib/profile/public-fields'

export const dynamic = 'force-dynamic'

async function loadSellerReviews(targetUserId: string) {
  try {
    return await prisma.review.findMany({
      where: {
        targetUserId,
        isDeleted: false,
        isHidden: false,
        reviewModerationState: 'PUBLISHED',
      },
      include: {
        author: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })
  } catch {
    return await prisma.review.findMany({
      where: { targetUserId, isDeleted: false },
      include: {
        author: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }).catch(() => [])
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = decodeURIComponent(params.id ?? '').trim()
  if (!userId) {
    return NextResponse.json({ error: 'Некорректный id' }, { status: 400 })
  }

  try {
    const seller = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        ...PROFILE_SELECT_PUBLIC,
        phone: true,
        email: true,
        vkId: true,
        yandexId: true,
        phoneVerifiedAt: true,
        listings: {
          where: { status: 'ACTIVE' },
          include: { category: true, _count: { select: { favorites: true } } },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    })

    if (!seller) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 })
    }

    const [badgesRaw, reviews] = await Promise.all([
      seller.showBadgesPublicly !== false
        ? getPublicUserBadges(seller.id).catch((err) => {
            console.error('profile badges load:', err)
            return []
          })
        : Promise.resolve([]),
      seller.showReviewsPublicly !== false ? loadSellerReviews(seller.id) : Promise.resolve([]),
    ])
    const badges = badgesRaw

    const trust = getProfileTrust({
      phone: seller.phone,
      phoneVerifiedAt: seller.phoneVerifiedAt,
      email: seller.email,
      vkId: seller.vkId,
      yandexId: seller.yandexId,
      name: seller.name,
      avatar: seller.avatar,
      description: seller.description,
      city: seller.city,
      isVerified: seller.isVerified,
      reviewCount: seller.reviewCount,
      listingCount: seller.listings.length,
      avgResponseMinutes: seller.avgResponseMinutes,
      profileType: seller.profileType,
    })

    const { phone, email, vkId, yandexId, listings, companyInn: _inn, ...rest } = seller
    const publicProfile = toPublicSellerProfile(seller)

    const publicListings = listings.map((listing) => ({
      ...listing,
      images: listing.images ?? [],
      createdAt: listing.createdAt.toISOString(),
      updatedAt: listing.updatedAt.toISOString(),
    }))

    return NextResponse.json({
      seller: {
        ...publicProfile,
        createdAt: rest.createdAt.toISOString(),
        phoneVerifiedAt: rest.phoneVerifiedAt?.toISOString() ?? null,
        lastSeenAt: rest.lastSeenAt?.toISOString() ?? null,
        listings: publicListings,
        reviews:
          seller.showReviewsPublicly !== false
            ? reviews.map((r) => ({
                ...r,
                createdAt: r.createdAt.toISOString(),
              }))
            : [],
        badges,
        trust,
        authProviders: {
          phone: Boolean(phone),
          email: Boolean(email),
          vk: Boolean(vkId),
          yandex: Boolean(yandexId),
        },
      },
    })
  } catch (error) {
    console.error('profile GET error:', error)
    return NextResponse.json(
      { error: 'Ошибка сервера', detail: process.env.NODE_ENV === 'development' ? String(error) : undefined },
      { status: 500 },
    )
  }
}
