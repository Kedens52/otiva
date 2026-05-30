import { AlertTriangle, CheckCircle2, TrendingDown, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"

type Insight = {
  status: string
  message?: string | null
  min?: number | null
  max?: number | null
  sampleSize?: number
}

const STATUS_UI: Record<
  string,
  { label: string; className: string; Icon: typeof CheckCircle2 }
> = {
  NORMAL: { label: "Цена в рынке", className: "bg-emerald-50 text-emerald-800 border-emerald-200/60", Icon: CheckCircle2 },
  LOW: { label: "Ниже рынка", className: "bg-amber-50 text-amber-900 border-amber-200/60", Icon: TrendingDown },
  VERY_LOW: { label: "Сильно ниже рынка", className: "bg-amber-50 text-amber-900 border-amber-200/60", Icon: TrendingDown },
  HIGH: { label: "Выше рынка", className: "bg-sky-50 text-sky-900 border-sky-200/60", Icon: TrendingUp },
  VERY_HIGH: { label: "Выше рынка", className: "bg-sky-50 text-sky-900 border-sky-200/60", Icon: TrendingUp },
}

/** Для страницы объявления — мягкий индикатор для покупателя и продавца */
export function ListingPriceInsightBadge({
  insight,
  buyerHint,
  compact,
}: {
  insight: Insight | null | undefined
  buyerHint?: string | null
  compact?: boolean
}) {
  if (!insight || insight.status === "UNKNOWN") return null

  const ui = STATUS_UI[insight.status]
  if (!ui) return null

  const { label, className, Icon } = ui
  const showBuyer =
    buyerHint && (insight.status === "LOW" || insight.status === "VERY_LOW")

  if (compact) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold",
          className,
        )}
      >
        <Icon className="h-3 w-3" aria-hidden />
        {label}
      </span>
    )
  }

  return (
    <div className="space-y-2">
      <div
        className={cn(
          "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium",
          className,
        )}
      >
        <Icon className="h-4 w-4 shrink-0" aria-hidden />
        {label}
        {insight.min != null && insight.max != null && (insight.sampleSize ?? 0) >= 5 ? (
          <span className="text-xs font-normal opacity-80">
            · рынок {insight.min.toLocaleString("ru-RU")}–{insight.max.toLocaleString("ru-RU")} ₽
          </span>
        ) : null}
      </div>
      {showBuyer ? (
        <p className="flex items-start gap-2 rounded-xl border border-amber-100 bg-amber-50/50 px-3 py-2.5 text-sm leading-relaxed text-amber-950">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden />
          {buyerHint}
        </p>
      ) : null}
    </div>
  )
}
