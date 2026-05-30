import type { AdStatus } from "@prisma/client"
import { AD_STATUS_LABELS } from "@/lib/ads/campaign-status"
import { cn } from "@/lib/utils"

const TONE: Partial<Record<AdStatus, string>> = {
  DRAFT: "bg-zinc-100 text-zinc-700",
  WAITING_PAYMENT: "bg-amber-50 text-amber-800",
  PENDING_REVIEW: "bg-blue-50 text-blue-800",
  ACTIVE: "bg-emerald-50 text-emerald-800",
  PAUSED: "bg-zinc-100 text-zinc-600",
  REJECTED: "bg-red-50 text-red-700",
  NEEDS_CHANGES: "bg-orange-50 text-orange-800",
  FINISHED: "bg-zinc-100 text-zinc-500",
  ARCHIVED: "bg-zinc-100 text-zinc-400",
}

export function AdCampaignStatusBadge({ status }: { status: AdStatus }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold",
        TONE[status] ?? "bg-zinc-100 text-zinc-600",
      )}
    >
      {AD_STATUS_LABELS[status]}
    </span>
  )
}
