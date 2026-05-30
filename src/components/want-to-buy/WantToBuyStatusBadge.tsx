import { Badge } from "@/components/ui/badge"
import { wantToBuyStatusLabel } from "@/lib/want-to-buy/labels"
import type { WantToBuyStatus } from "@prisma/client"
import { cn } from "@/lib/utils"

const VARIANTS: Partial<Record<WantToBuyStatus, "default" | "secondary" | "warning" | "success" | "destructive">> = {
  ACTIVE: "success",
  MODERATION: "warning",
  REJECTED: "destructive",
  CLOSED: "secondary",
  EXPIRED: "secondary",
}

export function WantToBuyStatusBadge({
  status,
  className,
}: {
  status: WantToBuyStatus | string
  className?: string
}) {
  const variant = VARIANTS[status as WantToBuyStatus] ?? "secondary"
  return (
    <Badge variant={variant} className={cn("font-semibold", className)}>
      {wantToBuyStatusLabel(status)}
    </Badge>
  )
}
