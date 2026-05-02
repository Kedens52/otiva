import { prisma } from "@/lib/prisma"
import type { Prisma, User } from "@prisma/client"

type OAuthProvider = "vk" | "yandex"

type OAuthProfile = {
  provider: OAuthProvider
  providerId: string
  email?: string | null
  phone?: string | null
  name?: string | null
  avatar?: string | null
  city?: string | null
}

type Tx = Prisma.TransactionClient

function clean(value?: string | null) {
  const next = value?.trim()
  return next || null
}

function providerWhere(provider: OAuthProvider, providerId: string): Prisma.UserWhereInput {
  return provider === "vk" ? { vkId: providerId } : { yandexId: providerId }
}

function providerData(provider: OAuthProvider, providerId: string): Prisma.UserUpdateInput {
  return provider === "vk" ? { vkId: providerId } : { yandexId: providerId }
}

function providerCreateData(provider: OAuthProvider, providerId: string): Prisma.UserCreateInput {
  return provider === "vk" ? { vkId: providerId } : { yandexId: providerId }
}

function isSameProvider(user: User, provider: OAuthProvider, providerId: string) {
  return provider === "vk" ? user.vkId === providerId : user.yandexId === providerId
}

function pickPrimary(users: User[], profile: OAuthProfile, email: string | null, phone: string | null) {
  return (
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

export async function findOrCreateOAuthUser(profile: OAuthProfile) {
  const providerId = profile.providerId
  const email = clean(profile.email)?.toLowerCase() ?? null
  const phone = clean(profile.phone)
  const name = clean(profile.name)
  const avatar = clean(profile.avatar)
  const city = clean(profile.city)
  const provider = providerData(profile.provider, providerId)
  const providerCreate = providerCreateData(profile.provider, providerId)

  return prisma.$transaction(async (tx) => {
    const users = await tx.user.findMany({
      where: {
        OR: [
          providerWhere(profile.provider, providerId),
          ...(email ? [{ email }] : []),
          ...(phone ? [{ phone }] : []),
        ],
      },
      orderBy: { createdAt: "asc" },
    })

    if (!users.length) {
      return tx.user.create({
        data: {
          ...providerCreate,
          email,
          phone,
          name,
          avatar,
          city,
        },
      })
    }

    const primary = pickPrimary(users, profile, email, phone)
    const duplicates = users.filter((user) => user.id !== primary.id)

    for (const duplicate of duplicates) {
      await mergeUserIntoPrimary(tx, primary.id, duplicate.id)
    }

    const current = await tx.user.findUniqueOrThrow({ where: { id: primary.id } })

    return tx.user.update({
      where: { id: primary.id },
      data: {
        ...provider,
        email: current.email || email,
        phone: current.phone || phone,
        name: current.name || name,
        avatar: current.avatar || avatar,
        city: current.city || city,
      },
    })
  })
}
