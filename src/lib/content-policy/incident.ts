import type {
  ContentModerationSeverity,
  ContentModerationSource,
  Prisma,
} from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { writeAudit } from "@/lib/admin/audit"

export type ContentIncidentPayload = Record<string, unknown>

export async function recordContentModerationIncident(input: {
  source: ContentModerationSource
  severity: ContentModerationSeverity
  userId: string
  listingId?: string | null
  wantToBuyId?: string | null
  reasonCode: string
  summary: string
  matchedRules?: string[]
  payload: ContentIncidentPayload
  ip?: string | null
  userAgent?: string | null
}): Promise<void> {
  try {
    const incident = await prisma.contentModerationIncident.create({
      data: {
        source: input.source,
        severity: input.severity,
        userId: input.userId,
        listingId: input.listingId ?? null,
        wantToBuyId: input.wantToBuyId ?? null,
        reasonCode: input.reasonCode,
        summary: input.summary.slice(0, 500),
        matchedRules: input.matchedRules?.length
          ? (input.matchedRules as Prisma.InputJsonValue)
          : undefined,
        payload: input.payload as Prisma.InputJsonValue,
      },
    })

    void writeAudit({
      action: "content.moderation_incident",
      targetType: "ContentModerationIncident",
      targetId: incident.id,
      metadata: {
        source: input.source,
        severity: input.severity,
        reasonCode: input.reasonCode,
        userId: input.userId,
        listingId: input.listingId,
        wantToBuyId: input.wantToBuyId,
        summary: input.summary,
      },
      ip: input.ip,
      userAgent: input.userAgent,
    })
  } catch (error) {
    console.error("recordContentModerationIncident error:", error)
  }
}

export async function loadUserContextForIncident(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      trustTier: true,
      isBanned: true,
      accountRestricted: true,
      createdAt: true,
    },
  })
}
