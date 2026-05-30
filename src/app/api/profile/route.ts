import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { updateProfileSchema } from "@/lib/validators/profile"
import { z } from "zod"
import { syncUserTrustSnapshot } from "@/lib/trust-tier"
import { buildUserIdentityMeta } from "@/lib/user-identity"
import { syncUserBadges } from "@/lib/badges/sync-user-badges"
import { getPublicUserBadges } from "@/lib/badges/get-public-badges"
import { syncSellerPublicSlug } from "@/lib/seo/sync-listing-slug"
import { calculateMarketplaceProfileCompleteness } from "@/lib/profile/completeness-marketplace"

export const dynamic = "force-dynamic"

const profileSelect = {
  id: true,
  phone: true,
  email: true,
  vkId: true,
  yandexId: true,
  name: true,
  firstName: true,
  lastName: true,
  avatar: true,
  description: true,
  profileHeadline: true,
  city: true,
  region: true,
  district: true,
  metro: true,
  addressNote: true,
  role: true,
  isVerified: true,
  isBanned: true,
  walletBalance: true,
  bonusBalance: true,
  bonusBlocked: true,
  rating: true,
  reviewCount: true,
  createdAt: true,
  trustTier: true,
  profileType: true,
  sellerRole: true,
  businessCategory: true,
  experience: true,
  serviceArea: true,
  deliveryOptions: true,
  guaranteeText: true,
  companyName: true,
  companyInn: true,
  companyWebsite: true,
  companyRole: true,
  websiteUrl: true,
  vkUrl: true,
  maxUrl: true,
  emailVerified: true,
  emailVerifiedAt: true,
  phoneVerifiedAt: true,
  showPhone: true,
  showPhonePublicly: true,
  showEmailPublicly: true,
  showCityPublicly: true,
  showDistrictPublicly: true,
  showActivityPublicly: true,
  showBadgesPublicly: true,
  showReviewsPublicly: true,
  lastLoginAt: true,
  notificationSettings: true,
  _count: { select: { listings: true, favorites: true, reviews: true } },
} as const

function emptyToNull(value: string | undefined) {
  if (value === undefined) return undefined
  const t = value.trim()
  return t ? t : null
}

function buildCompletenessPayload(
  user: {
    name: string | null
    avatar: string | null
    city: string | null
    description: string | null
    phone: string | null
    phoneVerifiedAt: Date | null
    profileType: string
    sellerRole: string | null
    companyName: string | null
  },
  activeListings: number,
) {
  return calculateMarketplaceProfileCompleteness({
    name: user.name,
    avatar: user.avatar,
    city: user.city,
    description: user.description,
    phone: user.phone,
    phoneVerifiedAt: user.phoneVerifiedAt,
    profileType: user.profileType,
    sellerRole: user.sellerRole,
    companyName: user.companyName,
    activeListingsCount: activeListings,
  })
}

// GET /api/profile
export async function GET() {
  try {
    const session = await getCurrentUser()
    if (!session) return NextResponse.json({ error: "Не авторизован" }, { status: 401 })

    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: profileSelect,
    })
    if (!user) return NextResponse.json({ error: "Не найден" }, { status: 404 })

    const listingStats = await prisma.listing.groupBy({
      by: ["status"],
      where: { sellerId: user.id },
      _count: { id: true },
    })
    const byStatus = Object.fromEntries(listingStats.map((s) => [s.status, s._count.id]))
    const activeListings = byStatus.ACTIVE ?? 0

    const identity = buildUserIdentityMeta(user)
    await syncUserBadges(session.id).catch(() => {})
    const badges = await getPublicUserBadges(session.id)
    const profileCompleteness = buildCompletenessPayload(user, activeListings)

    return NextResponse.json({
      user: {
        ...user,
        badges,
        profileCompleteness,
        authProviders: {
          phone: Boolean(user.phone),
          vk: Boolean(user.vkId),
          yandex: Boolean(user.yandexId),
        },
        identity,
        stats: {
          listingsTotal: user._count?.listings ?? 0,
          listingsActive: activeListings,
          listingsSold: byStatus.SOLD ?? 0,
          favorites: user._count?.favorites ?? 0,
          reviews: user._count?.reviews ?? 0,
        },
      },
    })
  } catch (e) {
    console.error("GET /api/profile", e)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}

// PATCH /api/profile
export async function PATCH(request: NextRequest) {
  try {
    const session = await getCurrentUser()
    if (!session) return NextResponse.json({ error: "Не авторизован" }, { status: 401 })

    const body = await request.json()
    const data = updateProfileSchema.parse(body)

    const current = await prisma.user.findUnique({
      where: { id: session.id },
      select: { firstName: true, lastName: true, name: true, profileType: true },
    })
    if (!current) return NextResponse.json({ error: "Не найден" }, { status: 404 })

    const profileType = data.profileType ?? current.profileType
    const updateData: Record<string, unknown> = {}

    const textFields = [
      "name",
      "firstName",
      "lastName",
      "profileHeadline",
      "description",
      "region",
      "city",
      "district",
      "metro",
      "addressNote",
      "businessCategory",
      "experience",
      "serviceArea",
      "guaranteeText",
      "companyRole",
      "websiteUrl",
      "vkUrl",
      "maxUrl",
    ] as const

    for (const key of textFields) {
      if (data[key] !== undefined) updateData[key] = emptyToNull(data[key])
    }

    if (data.avatar !== undefined) updateData.avatar = data.avatar || null
    if (data.profileType !== undefined) updateData.profileType = data.profileType
    if (data.deliveryOptions !== undefined) updateData.deliveryOptions = data.deliveryOptions

    if (profileType === "PERSON") {
      updateData.companyName = null
      updateData.companyInn = null
      updateData.companyWebsite = null
      updateData.companyRole = null
      if (data.sellerRole !== undefined) updateData.sellerRole = emptyToNull(data.sellerRole)
    } else {
      updateData.sellerRole = null
      if (data.companyName !== undefined) updateData.companyName = emptyToNull(data.companyName)
      if (data.companyInn !== undefined) updateData.companyInn = emptyToNull(data.companyInn)
      if (data.companyWebsite !== undefined) updateData.companyWebsite = emptyToNull(data.companyWebsite)
      if (data.companyRole !== undefined) updateData.companyRole = emptyToNull(data.companyRole)
    }

    const boolFields = [
      "showPhone",
      "showPhonePublicly",
      "showEmailPublicly",
      "showCityPublicly",
      "showDistrictPublicly",
      "showActivityPublicly",
      "showBadgesPublicly",
      "showReviewsPublicly",
    ] as const
    for (const key of boolFields) {
      if (data[key] !== undefined) updateData[key] = data[key]
    }

    if (data.firstName !== undefined || data.lastName !== undefined) {
      const firstName =
        data.firstName !== undefined ? emptyToNull(data.firstName) ?? null : current.firstName
      const lastName =
        data.lastName !== undefined ? emptyToNull(data.lastName) ?? null : current.lastName
      updateData.firstName = firstName
      updateData.lastName = lastName
      const combined = [firstName, lastName].filter(Boolean).join(" ").trim()
      if (combined) updateData.name = combined.slice(0, 80)
    }

    const updated = await prisma.user.update({
      where: { id: session.id },
      data: updateData,
      select: profileSelect,
    })

    void syncUserTrustSnapshot(session.id).catch(() => {})
    void syncUserBadges(session.id).catch(() => {})
    void syncSellerPublicSlug(session.id).catch(() => {})

    const { tryProfileBonuses } = await import("@/lib/bonuses/hooks")
    void tryProfileBonuses(updated, prisma).catch(() => {})

    const activeListings = await prisma.listing.count({
      where: { sellerId: session.id, status: "ACTIVE" },
    })

    return NextResponse.json({
      user: {
        ...updated,
        profileCompleteness: buildCompletenessPayload(updated, activeListings),
        authProviders: {
          phone: Boolean(updated.phone),
          vk: Boolean(updated.vkId),
          yandex: Boolean(updated.yandexId),
        },
        identity: buildUserIdentityMeta(updated),
      },
    })
  } catch (e) {
    if (e instanceof z.ZodError) {
      const first = e.errors[0]
      return NextResponse.json(
        { error: first?.message ?? "Неверные данные", fieldErrors: e.flatten().fieldErrors },
        { status: 400 },
      )
    }
    console.error("PATCH /api/profile", e)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}

// DELETE /api/profile — soft delete
export async function DELETE(request: NextRequest) {
  try {
    const session = await getCurrentUser()
    if (!session) return NextResponse.json({ error: "Не авторизован" }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    if (body?.confirm !== "УДАЛИТЬ") {
      return NextResponse.json({ error: "Подтверждение не совпадает" }, { status: 400 })
    }

    console.log(`[ACCOUNT DELETE] userId=${session.id} at ${new Date().toISOString()}`)

    const db = prisma as typeof prisma & {
      session: { deleteMany: (args: unknown) => Promise<unknown> }
    }
    await prisma.$transaction([
      prisma.listing.updateMany({
        where: { sellerId: session.id },
        data: { status: "ARCHIVED" },
      }),
      db.session.deleteMany({ where: { userId: session.id } }),
      prisma.user.update({
        where: { id: session.id },
        data: {
          isBanned: true,
          name: "Удалённый пользователь",
          phone: null,
          email: null,
          avatar: null,
          firstName: null,
          lastName: null,
          description: null,
          vkId: null,
          yandexId: null,
        },
      }),
    ])

    const response = NextResponse.json({ ok: true })
    response.cookies.delete("nashlo_token")
    return response
  } catch (e) {
    console.error("DELETE /api/profile", e)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}
