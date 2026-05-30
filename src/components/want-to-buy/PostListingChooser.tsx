"use client"

import { useEffect, useId, useRef, useState } from "react"
import Link from "next/link"
import { Plus, ShoppingBag, Tag } from "lucide-react"
import { cn } from "@/lib/utils"
import type { SiteMode } from "@/components/shared/ModeSwitcher"
import { getWantToBuyCreatePath } from "@/lib/want-to-buy/routes"

type PostListingChooserProps = {
  variant?: "button" | "compact"
  className?: string
  onNavigate?: () => void
  mode?: SiteMode
}

export function PostListingChooser({
  variant = "button",
  className,
  onNavigate,
  mode = "sell",
}: PostListingChooserProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const menuId = useId()

  useEffect(() => {
    if (!open) return
    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    function onEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", onPointerDown)
    document.addEventListener("keydown", onEscape)
    return () => {
      document.removeEventListener("mousedown", onPointerDown)
      document.removeEventListener("keydown", onEscape)
    }
  }, [open])

  function close() {
    setOpen(false)
    onNavigate?.()
  }

  const menu = (
    <div
      id={menuId}
      role="menu"
      className="absolute right-0 top-[calc(100%+6px)] z-[150] w-[min(92vw,240px)] overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white p-1.5 shadow-xl shadow-zinc-950/10"
    >
      <Link
        href="/create"
        role="menuitem"
        onClick={close}
        className="flex items-start gap-3 rounded-xl px-3 py-3 transition hover:bg-[#F5F6F8]"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FFF3EC] text-[#FF4F12]">
          <Tag className="h-4 w-4" />
        </span>
        <span>
          <span className="block text-sm font-semibold text-[#111827]">Продать</span>
          <span className="mt-0.5 block text-xs text-[#6B7280]">Разместить обычное объявление</span>
        </span>
      </Link>
      <Link
        href={getWantToBuyCreatePath()}
        role="menuitem"
        onClick={close}
        className="flex items-start gap-3 rounded-xl px-3 py-3 transition hover:bg-[#F5F6F8]"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FFF3EC] text-[#FF4F12]">
          <ShoppingBag className="h-4 w-4" />
        </span>
        <span>
          <span className="block text-sm font-semibold text-[#111827]">Купить</span>
          <span className="mt-0.5 block text-xs text-[#6B7280]">Создать заявку «Куплю»</span>
        </span>
      </Link>
    </div>
  )

  if (mode === "want") {
    return (
      <Link
        href={getWantToBuyCreatePath()}
        onClick={onNavigate}
        className={cn(
          variant === "compact"
            ? "text-sm font-medium text-[#6B7280] transition hover:text-[#111827] hover:underline underline-offset-2"
            : "ml-2 inline-flex h-8 items-center gap-1.5 rounded-[10px] bg-[#FF5A00] px-3.5 text-[13px] font-semibold text-white transition hover:bg-[#E8470F] active:scale-[0.98]",
          className,
        )}
      >
        {variant !== "compact" ? <Plus className="h-3.5 w-3.5 shrink-0" /> : null}
        <span>{variant === "compact" ? "Создать заявку →" : "Создать заявку"}</span>
      </Link>
    )
  }

  if (variant === "compact") {
    return (
      <div ref={rootRef} className={cn("relative", className)}>
        <button
          type="button"
          aria-expanded={open}
          aria-haspopup="menu"
          aria-controls={menuId}
          onClick={() => setOpen((v) => !v)}
          className="text-sm font-medium text-[#6B7280] transition hover:text-[#111827] hover:underline underline-offset-2"
        >
          Разместить →
        </button>
        {open ? menu : null}
      </div>
    )
  }

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
        className="ml-2 inline-flex h-8 items-center gap-1.5 rounded-[10px] bg-[#FF4F12] px-3.5 text-[13px] font-semibold text-white transition hover:bg-[#E8470F] active:scale-[0.98]"
      >
        <Plus className="h-3.5 w-3.5 shrink-0" />
        <span className="hidden lg:inline">Разместить</span>
      </button>
      {open ? menu : null}
    </div>
  )
}
