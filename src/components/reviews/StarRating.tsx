"use client"

import { Star } from "lucide-react"

export function StarRating({
  rating,
  max = 5,
  size = 14,
  className = "",
}: {
  rating: number
  max?: number
  size?: number
  className?: string
}) {
  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`}>
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          width={size}
          height={size}
          className={i < rating ? "fill-amber-400 text-amber-400" : "fill-zinc-200 text-zinc-200"}
        />
      ))}
    </span>
  )
}

export function StarPicker({
  value,
  onChange,
  size = 28,
}: {
  value: number
  onChange: (v: number) => void
  size?: number
}) {
  return (
    <span className="inline-flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--nashlo-orange)/0.4)] rounded"
          aria-label={`Оценка ${star}`}
        >
          <Star
            width={size}
            height={size}
            className={
              star <= value
                ? "fill-amber-400 text-amber-400 transition"
                : "fill-zinc-200 text-zinc-200 transition hover:fill-amber-200 hover:text-amber-200"
            }
          />
        </button>
      ))}
    </span>
  )
}
