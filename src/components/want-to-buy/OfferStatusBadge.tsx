import { Badge } from "@/components/ui/badge"
import { offerStatusLabel } from "@/lib/want-to-buy/labels"
import type { WantToBuyOfferStatus } from "@prisma/client"
import { cn } from "@/lib/utils"

const VARIANTS: Partial<Record<WantToBuyOfferStatus, "default" | "secondary" | "warning" | "success" | "destructive">> = {
  PENDING: "warning",
  VIEWED: "secondary",
  ACCEPTED: "success",
  DECLINED: "destructive",
}

export function OfferStatusBadge({
  status,
  className,
}: {
  status: WantToBuyOfferStatus | string
  className?: string
}) {
  const variant = VARIANTS[status as WantToBuyOfferStatus] ?? "secondary"
  return (
    <Badge variant={variant} className={cn("font-semibold", className)}>
      {offerStatusLabel(status)}
    </Badge>
  )
}
