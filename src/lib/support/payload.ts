import type { Prisma } from "@prisma/client"

export type SupportLink = { label: string; href: string }

export type AutoReplyPayload = {
  kind:         "auto_reply"
  autoReplyId:  string
  title:        string
  teaser:       string
  body:         string
  links:        SupportLink[]
  actionState:  "pending" | "helpful" | "escalated"
}

export type SystemSupportPayload = {
  kind: "system"
}

export type BotFlowPayload = {
  kind: "bot_flow"
  stepId: string
  buttons?: { id: string; label: string }[]
  listings?: {
    id: string
    title: string
    price: number
    image: string | null
    status: string
  }[]
  breadcrumbs?: string[]
  expectDescription?: boolean
  ticketCreated?: boolean
}

export type SupportMessagePayload = AutoReplyPayload | SystemSupportPayload | BotFlowPayload

export function isAutoReplyPayload(
  value: Prisma.JsonValue | null | undefined,
): value is AutoReplyPayload {
  return Boolean(value && typeof value === "object" && !Array.isArray(value) && (value as { kind?: string }).kind === "auto_reply")
}

export function isSystemSupportPayload(
  value: Prisma.JsonValue | null | undefined,
): value is SystemSupportPayload {
  return Boolean(value && typeof value === "object" && !Array.isArray(value) && (value as { kind?: string }).kind === "system")
}

export function isBotFlowPayload(
  value: Prisma.JsonValue | null | undefined,
): value is BotFlowPayload {
  return Boolean(value && typeof value === "object" && !Array.isArray(value) && (value as { kind?: string }).kind === "bot_flow")
}
