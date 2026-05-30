"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { AlertTriangle, CheckCircle2, HelpCircle, TrendingDown, TrendingUp } from "lucide-react"
import { lowPriceReasonsForCategory } from "@/lib/market-price/messages"
import { cn } from "@/lib/utils"

type EstimateResponse = {
  status: string
  range: { min: number; max: number; median: number; p25: number; p75: number } | null
  sampleSize: number
  confidence: string
  message: string
  reasonsRequired: boolean
  comparableListingsCount: number
}

type Props = {
  categorySlug: string
  price: number
  city?: string
  attributes?: Record<string, unknown>
  excludeListingId?: string
  disabled?: boolean
  reason?: string
  onReasonChange?: (reason: string) => void
}

const STATUS_LABELS: Record<string, string> = {
  NORMAL: "Цена в рынке",
  LOW: "Ниже рынка",
  VERY_LOW: "Сильно ниже рынка",
  HIGH: "Выше рынка",
  VERY_HIGH: "Значительно выше рынка",
  UNKNOWN: "Недостаточно данных",
}

function formatRub(n: number) {
  return n.toLocaleString("ru-RU") + " ₽"
}

function StatusIcon({ status }: { status: string }) {
  if (status === "NORMAL") return <CheckCircle2 className="h-5 w-5 text-emerald-600" aria-hidden />
  if (status === "UNKNOWN") return <HelpCircle className="h-5 w-5 text-zinc-400" aria-hidden />
  if (status === "HIGH" || status === "VERY_HIGH") return <TrendingUp className="h-5 w-5 text-amber-600" aria-hidden />
  return <TrendingDown className="h-5 w-5 text-amber-600" aria-hidden />
}

export function MarketPricePanel({
  categorySlug,
  price,
  city,
  attributes,
  excludeListingId,
  disabled,
  reason = "",
  onReasonChange,
}: Props) {
  const [estimate, setEstimate] = useState<EstimateResponse | null>(null)
  const [loading, setLoading] = useState(false)

  const reasons = useMemo(() => lowPriceReasonsForCategory(categorySlug), [categorySlug])

  useEffect(() => {
    if (disabled || !categorySlug || price <= 0) {
      setEstimate(null)
      return
    }

    const controller = new AbortController()
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch("/api/market-price/estimate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category: categorySlug,
            price,
            city: city || undefined,
            attributes,
            excludeListingId,
          }),
          signal: controller.signal,
        })
        if (res.ok) {
          setEstimate((await res.json()) as EstimateResponse)
        } else {
          setEstimate(null)
        }
      } catch {
        /* aborted or network */
      } finally {
        setLoading(false)
      }
    }, 450)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [categorySlug, price, city, attributes, excludeListingId, disabled])

  if (disabled || !categorySlug || price <= 0) return null

  return (
    <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4 sm:p-5">
      <p className="text-sm font-semibold text-zinc-900">Рыночная цена</p>

      {loading && !estimate ? (
        <p className="mt-2 text-sm text-zinc-500">Считаем вилку по похожим объявлениям…</p>
      ) : null}

      {estimate ? (
        <div className="mt-3 space-y-3">
          {estimate.range && estimate.sampleSize >= 5 ? (
            <p className="text-sm text-zinc-600">
              Рынок по похожим объявлениям:{" "}
              <span className="font-semibold text-zinc-900">
                {formatRub(estimate.range.min)}–{formatRub(estimate.range.max)}
              </span>
              <span className="text-zinc-400"> · {estimate.sampleSize} объявлений</span>
            </p>
          ) : (
            <p className="text-sm text-zinc-500">{estimate.message}</p>
          )}

          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-zinc-200/80 bg-white px-3 py-2.5">
            <StatusIcon status={estimate.status} />
            <div className="min-w-0">
              <p className="text-xs text-zinc-500">Ваша цена</p>
              <p className="text-base font-bold text-zinc-950">{formatRub(price)}</p>
            </div>
            <span
              className={cn(
                "ml-auto rounded-full px-2.5 py-1 text-xs font-semibold",
                estimate.status === "NORMAL" && "bg-emerald-50 text-emerald-800",
                (estimate.status === "LOW" || estimate.status === "VERY_LOW") && "bg-amber-50 text-amber-900",
                (estimate.status === "HIGH" || estimate.status === "VERY_HIGH") && "bg-sky-50 text-sky-900",
                estimate.status === "UNKNOWN" && "bg-zinc-100 text-zinc-600",
              )}
            >
              {STATUS_LABELS[estimate.status] ?? estimate.status}
            </span>
          </div>

          {estimate.range && estimate.status !== "UNKNOWN" ? (
            <p className="text-sm leading-relaxed text-zinc-600">{estimate.message}</p>
          ) : null}

          {estimate.reasonsRequired && onReasonChange ? (
            <div className="rounded-xl border border-amber-200/80 bg-amber-50/60 p-3">
              <p className="flex items-start gap-2 text-sm font-medium text-amber-950">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                Укажите причину низкой цены
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {reasons.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => onReasonChange(r.label)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                      reason === r.label
                        ? "border-[hsl(var(--nashlo-orange))] bg-white text-[hsl(var(--nashlo-orange))]"
                        : "border-amber-200/80 bg-white/80 text-amber-900 hover:border-amber-300",
                    )}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3 text-xs">
            <Link
              href={`/${categorySlug === "cars" ? "cars" : categorySlug}`}
              className="font-medium text-[hsl(var(--nashlo-orange))] hover:underline"
            >
              Похожие объявления
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  )
}
