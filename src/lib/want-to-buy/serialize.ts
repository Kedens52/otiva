import type { Prisma } from "@prisma/client"
import { getListingPublicPath } from "@/lib/seo/paths"
import {
  WANT_TO_BUY_CARD_INCLUDE,
  WANT_TO_BUY_DETAIL_INCLUDE,
} from "@/lib/want-to-buy/selects"

export type WantToBuyCardRow = Prisma.WantToBuyGetPayload<{
  include: typeof WANT_TO_BUY_CARD_INCLUDE
}>

export type WantToBuyDetailRow = Prisma.WantToBuyGetPayload<{
  include: typeof WANT_TO_BUY_DETAIL_INCLUDE
}>

export function serializeWantToBuyCard(row: WantToBuyCardRow) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    priceMax: row.priceMax,
    city: row.city,
    condition: row.condition,
    status: row.status,
    views: row.views,
    offerCount: row._count.offers,
    expiresAt: row.expiresAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
    category: row.category,
    buyer: row.user,
  }
}

export function serializeWantToBuyDetail(
  row: WantToBuyDetailRow,
  extras?: {
    isOwner?: boolean
    myOffer?: {
      id: string
      status: string
      price: number
      message: string
      listingId: string | null
      listingPath: string | null
      createdAt: string
    } | null
  },
) {
  return {
    ...serializeWantToBuyCard(row),
    updatedAt: row.updatedAt.toISOString(),
    rejectionReason: extras?.isOwner ? row.rejectionReason : null,
    isOwner: extras?.isOwner ?? false,
    myOffer: extras?.myOffer ?? null,
  }
}

export function serializeWantToBuyOfferForOwner(offer: {
  id: string
  message: string
  price: number
  status: string
  listingId: string | null
  createdAt: Date
  updatedAt: Date
  seller: {
    id: string
    name: string | null
    avatar: string | null
    rating: number
    reviewCount: number
    isVerified: boolean
  }
  listing: {
    id: string
    title: string
    slug: string | null
    city: string | null
    status: string
  } | null
}) {
  return {
    id: offer.id,
    message: offer.message,
    price: offer.price,
    status: offer.status,
    listingId: offer.listingId,
    listingPath: offer.listing
      ? getListingPublicPath({
          id: offer.listing.id,
          slug: offer.listing.slug,
          title: offer.listing.title,
          city: offer.listing.city,
        })
      : null,
    createdAt: offer.createdAt.toISOString(),
    updatedAt: offer.updatedAt.toISOString(),
    seller: offer.seller,
    listing: offer.listing
      ? {
          id: offer.listing.id,
          title: offer.listing.title,
          status: offer.listing.status,
        }
      : null,
  }
}
