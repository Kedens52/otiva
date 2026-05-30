export type WantToBuyBuyerPublic = {
  id: string
  name: string | null
  avatar: string | null
  rating: number
  reviewCount: number
}

export type WantToBuyCategoryPublic = {
  id?: string
  slug: string
  nameRu: string
}

export type WantToBuyCardItem = {
  id: string
  title: string
  description: string
  priceMax: number | null
  city: string | null
  condition: "NEW" | "USED" | "ANY"
  status: string
  views: number
  offerCount: number
  expiresAt: string
  createdAt: string
  category: WantToBuyCategoryPublic
  buyer: WantToBuyBuyerPublic
}

export type WantToBuyDetailItem = WantToBuyCardItem & {
  updatedAt: string
  rejectionReason: string | null
  isOwner: boolean
  myOffer: {
    id: string
    status: string
    price: number
    message: string
    listingId: string | null
    listingPath: string | null
    createdAt: string
  } | null
}

export type WantToBuyCategoryOption = {
  slug: string
  nameRu: string
}
