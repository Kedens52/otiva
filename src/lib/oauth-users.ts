import { prisma } from "@/lib/prisma"
import { formatPhone } from "@/lib/auth"
import type { Prisma, User } from "@prisma/client"

type OAuthProvider = "vk" | "yandex"

type OAuthProfile = {
  provider: OAuthProvider
  providerId: string
  email?: string | null
  phone?: string | null
  name?: string | null
  firstName?: string | null
  lastName?: string | null
  avatar?: string | null
  city?: string | null
}

type Tx = Prisma.TransactionClient
type SyncOptions = {
  preferredUserId?: string | null
  /** Вызывается перед созданием нового пользователя (rate limit регистрации). */
  assertCanRegister?: () => void | Promise<void>
}

export class RegistrationRateLimitError extends Error {
  constructor() {
    super("registration_rate_limit")
    this.name = "RegistrationRateLimitError"
  }
}

function clean(value?: string | null) {
  const next = value?.trim()
  return next || null
}

function cleanPhone(value?: string | null) {
  const phone = clean(value)
  if (!phone) return null
  const digits = phone.replace(/\D/g, "")
  return digits.length >= 10 ? formatPhone(phone) : null
}

function providerWhere(provider: OAuthProvider, providerId: string): Prisma.UserWhereInput {
  return provider === "vk" ? { vkId: providerId } : { yandexId: providerId }
}

function providerCreateData(provider: OAuthProvider, providerId: string): Prisma.UserCreateInput {
  return provider === "vk" ? { vkId: providerId } : { yandexId: providerId }
}

function isSameProvider(user: User, provider: OAuthProvider, providerId: string) {
  return provider === "vk" ? user.vkId === providerId : user.yandexId === providerId
}

function pickPrimary(users: User[], profile: OAuthProfile, email: string | null, phone: string | null, preferredUserId?: string | null) {
  return (
    users.find((user) => preferredUserId && user.id === preferredUserId) ||
    users.find((user) => email && user.email === email) ||
    users.find((user) => phone && user.phone === phone) ||
    users.find((user) => isSameProvider(user, profile.provider, profile.providerId)) ||
    users[0]
  )
}

async function deleteCollidingRelations(tx: Tx, primaryId: string, duplicateId: string) {
  const [primaryFavorites, primaryMembers, authoredReviews, receivedReviews] = await Promise.all([
    tx.favorite.findMany({ where: { userId: primaryId }, select: { listingId: true } }),
    tx.conversationMember.findMany({ where: { userId: primaryId }, select: { conversationId: true } }),
    tx.review.findMany({ where: { authorId: primaryId }, select: { sellerId: true } }),
    tx.review.findMany({ where: { sellerId: primaryId }, select: { authorId: true } }),
  ])

  const favoriteListingIds = primaryFavorites.map((item) => item.listingId)
  const memberConversationIds = primaryMembers.map((item) => item.conversationId)
  const authoredSellerIds = authoredReviews.map((item) => item.sellerId)
  const receivedAuthorIds = receivedReviews.map((item) => item.authorId)

  if (favoriteListingIds.length) {
    await tx.favorite.deleteMany({
      where: { userId: duplicateId, listingId: { in: favoriteListingIds } },
    })
  }

  if (memberConversationIds.length) {
    await tx.conversationMember.deleteMany({
      where: { userId: duplicateId, conversationId: { in: memberConversationIds } },
    })
  }

  if (authoredSellerIds.length) {
    await tx.review.deleteMany({
      where: { authorId: duplicateId, sellerId: { in: authoredSellerIds } },
    })
  }

  if (receivedAuthorIds.length) {
    await tx.review.deleteMany({
      where: { sellerId: duplicateId, authorId: { in: receivedAuthorIds } },
    })
  }

  await tx.review.deleteMany({
    where: {
      OR: [
        { authorId: duplicateId, sellerId: primaryId },
        { authorId: primaryId, sellerId: duplicateId },
      ],
    },
  })
}

async function mergeUserIntoPrimary(tx: Tx, primaryId: string, duplicateId: string) {
  await deleteCollidingRelations(tx, primaryId, duplicateId)

  await tx.listing.updateMany({ where: { sellerId: duplicateId }, data: { sellerId: primaryId } })
  await tx.message.updateMany({ where: { senderId: duplicateId }, data: { senderId: primaryId } })
  await tx.moderationLog.updateMany({ where: { moderatorId: duplicateId }, data: { moderatorId: primaryId } })
  await tx.favorite.updateMany({ where: { userId: duplicateId }, data: { userId: primaryId } })
  await tx.conversationMember.updateMany({ where: { userId: duplicateId }, data: { userId: primaryId } })
  await tx.review.updateMany({ where: { sellerId: duplicateId }, data: { sellerId: primaryId } })
  await tx.review.updateMany({ where: { authorId: duplicateId }, data: { authorId: primaryId } })
  await tx.otpCode.updateMany({ where: { userId: duplicateId }, data: { userId: primaryId } })
  await tx.user.delete({ where: { id: duplicateId } })
}

function pickMergedUserData(primary: User, duplicates: User[], profile: OAuthProfile, email: string | null, phone: string | null) {
  const all = [primary, ...duplicates]
  const vkId = profile.provider === "vk"
    ? profile.providerId
    : primary.vkId || all.find((user) => user.vkId)?.vkId || null
  const yandexId = profile.provider === "yandex"
    ? profile.providerId
    : primary.yandexId || all.find((user) => user.yandexId)?.yandexId || null

  const freshAvatar = clean(profile.avatar)
  const resolvedEmail = primary.email || email || all.find((user) => user.email)?.email || null
  const resolvedPhone = primary.phone || phone || all.find((user) => user.phone)?.phone || null

  const oauthName = clean(profile.name)
  const composedFromParts =
    [clean(profile.firstName), clean(profile.lastName)].filter(Boolean).join(" ").trim() || null

  const name =
    oauthName ||
    composedFromParts ||
    primary.name ||
    all.find((user) => user.name)?.name ||
    null

  const firstName =
    clean(profile.firstName) ||
    primary.firstName ||
    all.find((user) => user.firstName)?.firstName ||
    null

  const lastName =
    clean(profile.lastName) ||
    primary.lastName ||
    all.find((user) => user.lastName)?.lastName ||
    null

  return {
    vkId,
    yandexId,
    email: resolvedEmail,
    phone: resolvedPhone,
    name,
    firstName,
    lastName,
    avatar: freshAvatar || primary.avatar || all.find((user) => user.avatar)?.avatar || null,
    city: primary.city || clean(profile.city) || all.find((user) => user.city)?.city || null,
    isVerified: primary.isVerified || Boolean(resolvedPhone) || profile.provider === "vk" || all.some((user) => user.isVerified),
    emailVerified: primary.emailVerified || Boolean(resolvedEmail),
    phoneVerifiedAt: primary.phoneVerifiedAt || (resolvedPhone ? new Date() : undefined),
    lastLoginAt: new Date(),
  }
}

export async function findOrCreateOAuthUser(profile: OAuthProfile, options: SyncOptions = {}) {
  const providerId = profile.providerId?.trim()
  if (!providerId) {
    throw new Error("missing_provider_id")
  }
  const email = clean(profile.email)?.toLowerCase() ?? null
  const phone = cleanPhone(profile.phone)
  const name = clean(profile.name)
  const firstName = clean(profile.firstName)
  const lastName = clean(profile.lastName)
  const composedName =
    name || [firstName, lastName].filter(Boolean).join(" ").trim() || null
  const avatar = clean(profile.avatar)
  const city = clean(profile.city)
  const providerCreate = providerCreateData(profile.provider, providerId)

  return prisma.$transaction(async (tx) => {
    const users = await tx.user.findMany({
      where: {
        OR: [
          providerWhere(profile.provider, providerId),
          ...(options.preferredUserId ? [{ id: options.preferredUserId }] : []),
          ...(email ? [{ email }] : []),
          ...(phone ? [{ phone }] : []),
        ],
      },
      orderBy: { createdAt: "asc" },
    })

    if (!users.length) {
      await options.assertCanRegister?.()
      const user = await tx.user.create({
        data: {
          ...providerCreate,
          email,
          phone,
          name: composedName,
          firstName,
          lastName,
          avatar,
          city,
          isVerified: Boolean(phone) || profile.provider === "vk",
          emailVerified: Boolean(email),
          phoneVerifiedAt: phone ? new Date() : undefined,
          lastLoginAt: new Date(),
        },
      })
      return { user, isNew: true }
    }

    const primary = pickPrimary(users, profile, email, phone, options.preferredUserId)
    const duplicates = users.filter((user) => user.id !== primary.id)
    const mergedData = pickMergedUserData(primary, duplicates, profile, email, phone)

    for (const duplicate of duplicates) {
      await mergeUserIntoPrimary(tx, primary.id, duplicate.id)
    }

    const user = await tx.user.update({
      where: { id: primary.id },
      data: mergedData,
    })
    return { user, isNew: false }
  })
}

export async function findOrCreatePhoneUser(phoneInput: string, options: SyncOptions = {}) {
  const phone = cleanPhone(phoneInput)
  if (!phone) throw new Error("invalid_phone")

  return prisma.$transaction(async (tx) => {
    const users = await tx.user.findMany({
      where: {
        OR: [
          { phone },
          ...(options.preferredUserId ? [{ id: options.preferredUserId }] : []),
        ],
      },
      orderBy: { createdAt: "asc" },
    })

    if (!users.length) {
      await options.assertCanRegister?.()
      const user = await tx.user.create({
        data: {
          phone,
          isVerified: true,
        },
      })
      return { user, isNew: true }
    }

    const primary = users.find((user) => options.preferredUserId && user.id === options.preferredUserId) || users[0]
    const duplicates = users.filter((user) => user.id !== primary.id)
    const mergedData = {
      vkId: primary.vkId || duplicates.find((user) => user.vkId)?.vkId || null,
      yandexId: primary.yandexId || duplicates.find((user) => user.yandexId)?.yandexId || null,
      email: primary.email || duplicates.find((user) => user.email)?.email || null,
      phone,
      name: primary.name || duplicates.find((user) => user.name)?.name || null,
      firstName: primary.firstName || duplicates.find((user) => user.firstName)?.firstName || null,
      lastName: primary.lastName || duplicates.find((user) => user.lastName)?.lastName || null,
      avatar: primary.avatar || duplicates.find((user) => user.avatar)?.avatar || null,
      city: primary.city || duplicates.find((user) => user.city)?.city || null,
      isVerified: true,
      lastLoginAt: new Date(),
    }

    for (const duplicate of duplicates) {
      await mergeUserIntoPrimary(tx, primary.id, duplicate.id)
    }

    const user = await tx.user.update({
      where: { id: primary.id },
      data: mergedData,
    })

    return { user, isNew: false }
  })
}
