/** Публичные поля покупателя — без телефона и email. */
export const WANT_TO_BUY_PUBLIC_BUYER_SELECT = {
  id: true,
  name: true,
  avatar: true,
  rating: true,
  reviewCount: true,
} as const

/** Продавец в отклике для владельца заявки — без контактов. */
export const WANT_TO_BUY_OFFER_SELLER_SELECT = {
  id: true,
  name: true,
  avatar: true,
  rating: true,
  reviewCount: true,
  isVerified: true,
} as const

export const WANT_TO_BUY_CATEGORY_SELECT = {
  id: true,
  slug: true,
  nameRu: true,
} as const

export const WANT_TO_BUY_CARD_INCLUDE = {
  user: { select: WANT_TO_BUY_PUBLIC_BUYER_SELECT },
  category: { select: WANT_TO_BUY_CATEGORY_SELECT },
  _count: { select: { offers: true } },
} as const

export const WANT_TO_BUY_DETAIL_INCLUDE = {
  user: { select: WANT_TO_BUY_PUBLIC_BUYER_SELECT },
  category: { select: WANT_TO_BUY_CATEGORY_SELECT },
  _count: { select: { offers: true } },
} as const
