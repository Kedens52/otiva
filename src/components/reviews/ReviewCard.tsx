"use client"

import { useState } from "react"
import Link from "next/link"
import { Flag, MessageSquare } from "lucide-react"
import { StarRating } from "@/components/reviews/StarRating"
import { ReviewReportModal } from "@/components/reviews/ReviewReportModal"
import { ReviewReplyForm } from "@/components/reviews/ReviewReplyForm"

export type ReviewCardData = {
  id: string
  rating: number
  text: string | null
  tags: string[]
  replyText: string | null
  repliedAt: string | null
  createdAt: string
  listingId: string | null
  author: { id: string; name: string | null; avatar: string | null }
  listing: { id: string; title: string; slug: string | null } | null
}

type Props = {
  review: ReviewCardData
  currentUserId?: string | null
  targetUserId?: string | null
  onReplySuccess?: (reviewId: string, replyText: string) => void
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })
  } catch { return "" }
}

export function ReviewCard({ review, currentUserId, targetUserId, onReplySuccess }: Props) {
  const [showReport, setShowReport] = useState(false)
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [localReply, setLocalReply] = useState<string | null>(review.replyText)

  const canReply = currentUserId === targetUserId && !localReply && !showReplyForm
  const initials = review.author.name?.slice(0, 2).toUpperCase() ?? "??"

  function handleReplySuccess(text: string) {
    setLocalReply(text)
    setShowReplyForm(false)
    onReplySuccess?.(review.id, text)
  }

  return (
    <div className="rounded-2xl border border-zinc-100 bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          {review.author.avatar ? (
            <img src={review.author.avatar} alt={review.author.name ?? ""} className="h-9 w-9 shrink-0 rounded-full object-cover" />
          ) : (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-500">
              {initials}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-semibold text-zinc-950 leading-tight">{review.author.name ?? "Пользователь"}</p>
            <p className="text-xs text-zinc-400 mt-0.5">{formatDate(review.createdAt)}</p>
          </div>
        </div>
        <StarRating rating={review.rating} size={14} />
      </div>

      {review.tags && review.tags.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {review.tags.map((tag) => (
            <span key={tag} className="inline-flex items-center rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-xs text-zinc-600">
              {tag}
            </span>
          ))}
        </div>
      )}

      {review.text && <p className="mt-2.5 text-sm leading-relaxed text-zinc-700">{review.text}</p>}

      {review.listing && (
        <Link
          href={review.listing.slug ? `/listings/${review.listing.slug}` : `/listings/${review.listing.id}`}
          className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg border border-zinc-100 bg-zinc-50 px-2.5 py-1 text-xs text-zinc-600 transition hover:border-zinc-200 hover:text-zinc-900"
        >
          <span className="truncate max-w-[220px]">{review.listing.title}</span>
        </Link>
      )}

      {localReply && (
        <div className="mt-3 rounded-xl border border-zinc-100 bg-[#FAFAFA] px-3 py-2.5">
          <p className="text-xs font-semibold text-zinc-500 mb-1">Ответ продавца</p>
          <p className="text-sm leading-relaxed text-zinc-700">{localReply}</p>
        </div>
      )}

      {showReplyForm && (
        <ReviewReplyForm reviewId={review.id} onSuccess={handleReplySuccess} onCancel={() => setShowReplyForm(false)} />
      )}

      <div className="mt-3 flex items-center gap-3 border-t border-zinc-50 pt-3">
        {canReply && (
          <button type="button" onClick={() => setShowReplyForm(true)} className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-900 transition">
            <MessageSquare className="h-3.5 w-3.5" />
            Ответить
          </button>
        )}
        {currentUserId && currentUserId !== review.author.id && (
          <button type="button" onClick={() => setShowReport(true)} className="ml-auto inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-red-500 transition">
            <Flag className="h-3.5 w-3.5" />
            Пожаловаться
          </button>
        )}
      </div>

      {showReport && <ReviewReportModal reviewId={review.id} onClose={() => setShowReport(false)} />}
    </div>
  )
}
