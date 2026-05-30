import type { SupportTicketContext } from "@/lib/admin/support-ticket-context"

export type SupportUser = {
  id: string
  name: string | null
  phone: string | null
  email: string | null
  role: string
  createdAt?: string
}

export type SupportMessage = {
  id: string
  text: string
  images?: string[]
  createdAt: string
  supportPayload?: unknown
  sender: { id: string; name: string | null; role: string }
}

export type SupportConversationSummary = {
  id: string
  updatedAt: string
  supportWorkflowStatus?: string
  operatorNeeded?: boolean
  supportTopic?: string | null
  supportSubtopic?: string | null
  supportListingId?: string | null
  supportAdCampaignId?: string | null
  supportPriority?: string | null
  client: SupportUser | null
  lastMessage: SupportMessage | null
  unreadCount: number
}

export type SupportConversationDetail = SupportConversationSummary & {
  messages: SupportMessage[]
  lastAutoReplyCatalogId?: string | null
  lastAutoReplyAction?: string | null
}

export type OperatorQuickReply = {
  id: string
  title: string
  category: string
  body: string
  tags: string[]
  active: boolean
  sortOrder: number
  isFavorite: boolean
  usageCount: number
  createdAt: string
  updatedAt: string
}

export type SupportPermissions = {
  canReply: boolean
  canManageQuickReplies: boolean
  canViewSensitive: boolean
}

export type { SupportTicketContext }
