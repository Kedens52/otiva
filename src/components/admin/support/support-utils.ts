import { isAutoReplyPayload, isBotFlowPayload, isSystemSupportPayload } from "@/lib/support/payload"
import { topicBreadcrumbLabels } from "@/lib/support/topics"
import type { SupportMessage } from "./types"

export function workflowLabel(status?: string, operator?: boolean) {
  if (operator || status === "WAITING_OPERATOR") return "Ждёт оператора"
  if (status === "RESOLVED_AUTO") return "Закрыто: автоответ"
  if (status === "CLOSED") return "Закрыт оператором"
  return "Активно"
}

export function isTicketClosed(status?: string) {
  return status === "CLOSED" || status === "RESOLVED_AUTO"
}

export function timeLabel(value: string) {
  return new Date(value).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function topicSummary(topic?: string | null, subtopic?: string | null) {
  const labels = topicBreadcrumbLabels(topic ?? undefined, subtopic ?? undefined)
  return labels.length ? labels.join(" · ") : null
}

export function ticketBadges(conversation: {
  supportListingId?: string | null
  supportAdCampaignId?: string | null
  supportTopic?: string | null
  operatorNeeded?: boolean
}) {
  const badges: string[] = []
  if (conversation.supportListingId) badges.push("Объявление")
  if (conversation.supportAdCampaignId) badges.push("Реклама")
  if (conversation.supportTopic === "fraud" || conversation.supportTopic?.includes("report")) {
    badges.push("Жалоба")
  }
  if (conversation.supportTopic === "business" || conversation.supportTopic?.includes("business")) {
    badges.push("Бизнес")
  }
  if (conversation.operatorNeeded) badges.push("Очередь")
  return badges
}

export function lastAutoReplySummary(messages: SupportMessage[]): string | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const p = messages[i]?.supportPayload as { title?: string; autoReplyId?: string } | undefined
    if (isAutoReplyPayload(p)) return `${p.title} (${p.autoReplyId})`
  }
  return null
}

export function lastAutoReplyFeedback(messages: SupportMessage[]): string | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const p = messages[i]?.supportPayload as { actionState?: string } | undefined
    if (isAutoReplyPayload(p) && p.actionState !== "pending") {
      return p.actionState === "helpful" ? "Помогло" : "Не помогло → оператор"
    }
  }
  return null
}

export { isAutoReplyPayload, isBotFlowPayload, isSystemSupportPayload }
