"use client"

import { useState } from "react"
import type { Review } from "@/lib/mock-reviews"

function Stars({ value, size = "sm" }: { value: number; size?: "sm" | "lg" }) {
  return (
    <span className={`inline-flex gap-0.5 ${size === "lg" ? "text-2xl" : "text-sm"}`}>
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} className={s <= value ? "text-[hsl(var(--nashlo-orange))]" : "text-zinc-200"}>★</span>
      ))}
    </span>
  )
}

export function ReviewCard({ review }: { review: Review }) {
  const [helpful, setHelpful] = useState(review.helpful)
  const [voted,   setVoted]   = useState(false)

  return (
    <article className="rounded-[24px] border border-zinc-100 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--nashlo-orange)/0.12)] text-sm font-semibold text-[hsl(var(--nashlo-orange))]">
          {review.avatar}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-semibold text-zinc-950">{review.author}</p>
            <span className="text-xs text-zinc-400">{review.date}</span>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <Stars value={review.rating} />
            <span className="text-xs text-zinc-400">· {review.role === "buyer" ? "покупатель" : "продавец"}</span>
          </div>
        </div>
      </div>

      <p className="mt-3 text-sm leading-6 text-zinc-700">{review.text}</p>

      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="truncate text-xs text-zinc-400">По объявлению: {review.listingTitle}</p>
        <button
          onClick={() => { if (!voted) { setHelpful((h) => h + 1); setVoted(true) } }}
          className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition ${voted ? "border-[hsl(var(--nashlo-mint)/0.4)] bg-[hsl(var(--nashlo-mint)/0.08)] text-[hsl(var(--nashlo-mint))]" : "border-zinc-200 text-zinc-500 hover:border-zinc-300 hover:text-zinc-950"}`}
        >
          👍 {helpful}
        </button>
      </div>
    </article>
  )
}

export function Stars5({ value, size }: { value: number; size?: "sm" | "lg" }) {
  return <Stars value={value} size={size} />
}
