"use client"

import { useMemo, useState } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import type { WantToBuyCategoryOption } from "@/lib/want-to-buy/client-types"
import {
  getWantToBuyCategoryIcon,
  getWantToBuyCategoryTitle,
  sortWantToBuyCategories,
  WANT_TO_BUY_CATEGORY_BG,
} from "@/lib/want-to-buy/category-display"

type WantToBuyCategoryPickerProps = {
  categories: WantToBuyCategoryOption[]
  value: string
  onChange: (slug: string) => void
}

function CategoryTile({
  slug,
  title,
  selected,
  onSelect,
}: {
  slug: string
  title: string
  selected: boolean
  onSelect: () => void
}) {
  const [imgFailed, setImgFailed] = useState(false)
  const bg = WANT_TO_BUY_CATEGORY_BG[slug] ?? "#F3F4F6"
  const icon = getWantToBuyCategoryIcon(slug)

  return (
    <button
      type="button"
      onClick={onSelect}
      style={{ backgroundColor: bg }}
      className={cn(
        "relative flex h-[88px] w-full overflow-hidden rounded-[14px] text-left transition",
        "hover:brightness-[0.97] active:brightness-[0.93]",
        selected &&
          "ring-2 ring-[#FF5A00] ring-offset-2 ring-offset-white",
      )}
    >
      <span className="absolute left-0 top-0 z-10 max-w-[72%] pl-3 pt-3">
        <span className="block text-[12px] font-semibold leading-tight text-zinc-900 sm:text-[13px]">
          {title}
        </span>
      </span>
      <span className="absolute bottom-1 right-1 flex items-end justify-end pb-1 pr-1">
        {imgFailed ? (
          <span className="text-3xl opacity-80" aria-hidden>
            {icon}
          </span>
        ) : (
          <img
            src={`/categories/${slug}.svg`}
            alt=""
            className="h-[52px] w-[52px] object-contain opacity-85"
            onError={() => setImgFailed(true)}
          />
        )}
      </span>
    </button>
  )
}

export function WantToBuyCategoryPicker({
  categories,
  value,
  onChange,
}: WantToBuyCategoryPickerProps) {
  const [query, setQuery] = useState("")
  const sorted = useMemo(() => sortWantToBuyCategories(categories), [categories])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return sorted
    return sorted.filter((c) => {
      const title = getWantToBuyCategoryTitle(c.slug, c.nameRu).toLowerCase()
      return title.includes(q) || c.slug.includes(q)
    })
  }, [sorted, query])

  return (
    <div className="space-y-4">
      {sorted.length > 10 ? (
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Найти категорию…"
            className="pl-9"
          />
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {filtered.map((c) => {
          const title = getWantToBuyCategoryTitle(c.slug, c.nameRu)
          return (
            <CategoryTile
              key={c.slug}
              slug={c.slug}
              title={title}
              selected={value === c.slug}
              onSelect={() => onChange(c.slug)}
            />
          )
        })}
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-sm text-[#4B4B4B]">Категория не найдена</p>
      ) : null}
    </div>
  )
}
