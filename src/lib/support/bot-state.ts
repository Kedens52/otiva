export type SupportBotState = {
  step: string
  topicId?: string
  subtopicId?: string
  issueId?: string
  listingId?: string
  adCampaignId?: string
  description?: string
  clarifyAttempts?: number
}

export const INITIAL_BOT_STATE: SupportBotState = { step: "idle", clarifyAttempts: 0 }

export function parseBotState(value: unknown): SupportBotState {
  if (!value || typeof value !== "object" || Array.isArray(value)) return { ...INITIAL_BOT_STATE }
  const o = value as Record<string, unknown>
  return {
    step: typeof o.step === "string" ? o.step : "idle",
    topicId: typeof o.topicId === "string" ? o.topicId : undefined,
    subtopicId: typeof o.subtopicId === "string" ? o.subtopicId : undefined,
    issueId: typeof o.issueId === "string" ? o.issueId : undefined,
    listingId: typeof o.listingId === "string" ? o.listingId : undefined,
    adCampaignId: typeof o.adCampaignId === "string" ? o.adCampaignId : undefined,
    description: typeof o.description === "string" ? o.description : undefined,
    clarifyAttempts: typeof o.clarifyAttempts === "number" ? o.clarifyAttempts : 0,
  }
}
