/** Общие include для списка и детали диалогов */
export const conversationListInclude = {
  members: {
    include: {
      user: { select: { id: true, name: true, avatar: true, phone: true } },
    },
  },
  listing: {
    select: { id: true, title: true, price: true, images: true },
  },
  company: {
    select: { id: true, name: true, logoUrl: true, slug: true },
  },
  businessListing: {
    select: { id: true, title: true, slug: true, price: true, images: true },
  },
  businessInquiry: {
    select: { id: true, type: true, contactName: true, status: true },
  },
  messages: {
    orderBy: { createdAt: "desc" as const },
    take: 1,
    include: {
      sender: { select: { id: true, name: true, avatar: true } },
    },
  },
} as const

export const conversationDetailInclude = {
  members: {
    include: {
      user: { select: { id: true, name: true, avatar: true, phone: true } },
    },
  },
  listing: {
    select: { id: true, title: true, price: true, images: true, status: true },
  },
  company: {
    select: { id: true, name: true, logoUrl: true, slug: true },
  },
  businessListing: {
    select: { id: true, title: true, slug: true, price: true, images: true },
  },
  businessInquiry: {
    select: { id: true, type: true, contactName: true, status: true },
  },
  messages: {
    orderBy: { createdAt: "asc" as const },
    include: {
      sender: { select: { id: true, name: true, avatar: true } },
    },
  },
} as const
