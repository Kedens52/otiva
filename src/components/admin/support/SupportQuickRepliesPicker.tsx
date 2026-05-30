"use client"

import { useMemo, useState } from "react"
import {
  SUPPORT_QUICK_REPLY_CATEGORIES,
  applyQuickReplyVariables,
  quickReplyCategoryLabel,
  suggestQuickReplyCategories,
  type QuickReplyVariableContext,
  type SupportQuickReplyCategoryId,
} from "@/lib/support/operator-quick-replies"
import type { OperatorQuickReply } from "./types"

type SupportQuickRepliesPickerProps = {
  open: boolean
  onClose: () => void
  items: OperatorQuickReply[]
  variableContext: QuickReplyVariableContext
  supportTopic?: string | null
  supportSubtopic?: string | null
  lastMessageText?: string | null
  hasListing?: boolean
  hasAd?: boolean
  hasBusiness?: boolean
  onInsert: (text: string, quickReplyId: string, missingVars: string[]) => void
}

export function SupportQuickRepliesPicker({
  open,
  onClose,
  items,
  variableContext,
  supportTopic,
  supportSubtopic,
  lastMessageText,
  hasListing,
  hasAd,
  hasBusiness,
  onInsert,
}: SupportQuickRepliesPickerProps) {
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState<SupportQuickReplyCategoryId | "all" | "suggested">("suggested")

  const suggestedCategories = useMemo(
    () =>
      suggestQuickReplyCategories({
        supportTopic,
        supportSubtopic,
        lastMessageText,
        hasListing,
        hasAd,
        hasBusiness,
      }),
    [supportTopic, supportSubtopic, lastMessageText, hasListing, hasAd, hasBusiness],
  )

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return items
      .filter((item) => item.active)
      .filter((item) => {
        if (category === "all") return true
        if (category === "suggested") return suggestedCategories.includes(item.category as SupportQuickReplyCategoryId)
        return item.category === category
      })
      .filter((item) => {
        if (!needle) return true
        return (
          item.title.toLowerCase().includes(needle) ||
          item.body.toLowerCase().includes(needle) ||
          item.tags.some((t) => t.toLowerCase().includes(needle))
        )
      })
      .sort((a, b) => {
        if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1
        return a.sortOrder - b.sortOrder || a.title.localeCompare(b.title, "ru")
      })
  }, [items, search, category, suggestedCategories])

  if (!open) return null

  return (
    <div className="absolute bottom-full left-0 right-0 z-20 mb-2 max-h-[min(320px,50vh)] overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-lg">
      <div className="flex items-center justify-between border-b border-zinc-100 px-3 py-2">
        <p className="text-sm font-semibold text-zinc-950">Быстрые ответы</p>
        <button type="button" onClick={onClose} className="text-xs font-semibold text-zinc-500 hover:text-zinc-800">
          Закрыть
        </button>
      </div>
      <div className="space-y-2 border-b border-zinc-100 p-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск шаблона…"
          className="h-9 w-full rounded-xl border border-zinc-200 px-3 text-sm outline-none focus:border-[hsl(var(--nashlo-orange))]"
        />
        <div className="flex flex-wrap gap-1">
          <CatBtn active={category === "suggested"} onClick={() => setCategory("suggested")}>
            Рекомендуемые
          </CatBtn>
          <CatBtn active={category === "all"} onClick={() => setCategory("all")}>
            Все
          </CatBtn>
          {SUPPORT_QUICK_REPLY_CATEGORIES.map((c) => (
            <CatBtn key={c.id} active={category === c.id} onClick={() => setCategory(c.id)}>
              {c.label}
            </CatBtn>
          ))}
        </div>
      </div>
      <div className="max-h-[220px] overflow-y-auto p-2">
        {filtered.length === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-zinc-400">Шаблоны не найдены</p>
        ) : (
          filtered.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                const { text, missing } = applyQuickReplyVariables(item.body, variableContext)
                onInsert(text, item.id, missing)
                onClose()
              }}
              className="mb-1 block w-full rounded-xl border border-zinc-100 px-3 py-2 text-left hover:border-[hsl(var(--nashlo-orange)/0.35)] hover:bg-orange-50/40"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-zinc-900">{item.title}</p>
                <span className="shrink-0 text-[10px] text-zinc-400">
                  {quickReplyCategoryLabel(item.category)}
                </span>
              </div>
              <p className="mt-1 line-clamp-2 text-xs text-zinc-500">{item.body}</p>
              {item.usageCount > 0 ? (
                <p className="mt-1 text-[10px] text-zinc-400">Использований: {item.usageCount}</p>
              ) : null}
            </button>
          ))
        )}
      </div>
    </div>
  )
}

function CatBtn({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-2 py-1 text-[11px] font-semibold ${
        active
          ? "bg-zinc-950 text-white"
          : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
      }`}
    >
      {children}
    </button>
  )
}
