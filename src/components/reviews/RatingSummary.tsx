import type { Review } from "@/lib/mock-reviews"
import { calcRating } from "@/lib/mock-reviews"

export function RatingSummary({ reviews }: { reviews: Review[] }) {
  const { avg, count, dist } = calcRating(reviews)
  const max = Math.max(...dist, 1)

  return (
    <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
      {/* Big number */}
      <div className="flex flex-col items-center justify-center rounded-[24px] bg-zinc-50 px-8 py-6 text-center shrink-0">
        <p className="text-6xl font-bold tracking-tight text-zinc-950">{avg}</p>
        <div className="mt-2 flex gap-0.5">
          {[1, 2, 3, 4, 5].map((s) => (
            <span key={s} className={`text-xl ${s <= Math.round(avg) ? "text-[hsl(var(--nashlo-orange))]" : "text-zinc-200"}`}>★</span>
          ))}
        </div>
        <p className="mt-1 text-sm text-zinc-500">{count} {count === 1 ? "отзыв" : count < 5 ? "отзыва" : "отзывов"}</p>
      </div>

      {/* Bars */}
      <div className="flex-1 space-y-2">
        {[5, 4, 3, 2, 1].map((star) => {
          const n = dist[star - 1]
          const pct = max ? Math.round((n / max) * 100) : 0
          return (
            <div key={star} className="flex items-center gap-3">
              <span className="w-3 shrink-0 text-right text-sm font-medium text-zinc-500">{star}</span>
              <span className="text-sm text-[hsl(var(--nashlo-orange))]">★</span>
              <div className="flex-1 h-2 overflow-hidden rounded-full bg-zinc-100">
                <div
                  className="h-2 rounded-full bg-[hsl(var(--nashlo-orange))] transition-all"
                  style={{ width: pct + "%" }}
                />
              </div>
              <span className="w-4 shrink-0 text-right text-xs text-zinc-400">{n}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
