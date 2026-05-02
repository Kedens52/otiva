"use client"

import { useState } from "react"

export type Review = {
  id: string
  rating: number
  text?: string | null
  createdAt?: string
  author: { id?: string; name?: string | null; avatar?: string | null }
}

export function ReviewCard({ review }: { review: Review }) {
  const [helpful, setHelpful] = useState(0)
  const [voted,   setVoted]   = useState(false)
  const initials = (review.author.name ?? "А")[0].toUpperCase()
  const date = review.createdAt
    ? new Date(review.createdAt).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })
    : ""

  return (
    <article className="rounded-[24px] border border-zinc-100 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        {review.author.avatar ? (
          <img src={review.author.avatar} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
        ) : (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--nashlo-orange)/0.12)] text-sm font-semibold text-[hsl(var(--nashlo-orange))]">
            {initials}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-semibold text-zinc-950">{review.author.name ?? "Пользователь"}</p>
            {date && <span className="text-xs text-zinc-400">{date}</span>}
          </div>
          <div className="mt-1 flex gap-0.5">
            {[1,2,3,4,5].map((s) => (
              <span key={s} className={`text-sm ${s <= review.rating ? "text-[hsl(var(--nashlo-orange))]" : "text-zinc-200"}`}>★</span>
            ))}
          </div>
        </div>
      </div>

      {review.text && <p className="mt-3 text-sm leading-6 text-zinc-700">{review.text}</p>}

      <div className="mt-3 flex justify-end">
        <button
          onClick={() => { if (!voted) { setHelpful((h) => h + 1); setVoted(true) } }}
          className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${voted ? "border-emerald-200 bg-emerald-50 text-emerald-600" : "border-zinc-200 text-zinc-500 hover:border-zinc-300"}`}
        >
          👍 {helpful > 0 ? helpful : "Полезно"}
        </button>
      </div>
    </article>
  )
}
