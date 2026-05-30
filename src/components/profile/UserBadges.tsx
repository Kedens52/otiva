"use client"

import { useEffect, useId, useRef, useState } from "react"
import type { BadgeCode } from "@prisma/client"
import type { PublicUserBadge } from "@/lib/badges/badge-map"
import { badgeAssetFile, sortBadgesByPriority } from "@/lib/badges/badge-map"
import {
  normalizeBadgeInput,
  publicBadgesToUserBadges,
  type UserBadge,
} from "@/lib/badges/user-badge-types"
import { cn } from "@/lib/utils"

type BadgeInput = PublicUserBadge[] | UserBadge[]

type Props = {
  badges: BadgeInput
  max?: number
  size?: "sm" | "md" | "lg"
  /** icons — сетка; chips — плашки; scrollRow — горизонтальная лента (mobile profile) */
  variant?: "icons" | "chips" | "scrollRow"
  showLabels?: boolean
  className?: string
}

const SIZE_PX = { sm: 20, md: 32, lg: 40 } as const

function toVisibleUserBadges(badges: BadgeInput, max?: number): UserBadge[] {
  if (!badges.length) return []
  const first = badges[0]
  if (first && "code" in first) {
    const sorted = sortBadgesByPriority(badges as PublicUserBadge[])
    const sliced = max ? sorted.slice(0, max) : sorted
    return publicBadgesToUserBadges(sliced)
  }
  const active = (badges as UserBadge[]).filter((b) => b.active !== false)
  return max ? active.slice(0, max) : active
}

function BadgeIcon({
  badge,
  size,
  onOpen,
  onClose,
  open,
  tooltipId,
}: {
  badge: UserBadge
  size: keyof typeof SIZE_PX
  onOpen: () => void
  onClose: () => void
  open: boolean
  tooltipId: string
}) {
  const [broken, setBroken] = useState(false)
  const [src, setSrc] = useState(badge.icon ?? "")

  const containerSize = size === "sm" ? 28 : size === "lg" ? 44 : 36
  const imgSize = size === "sm" ? 16 : size === "lg" ? 26 : 22

  function onImgError() {
    const code = badge.id as BadgeCode
    const staticUrl = `/badges/${badgeAssetFile(code)}`
    if (src !== staticUrl) {
      setSrc(staticUrl)
      return
    }
    setBroken(true)
  }

  return (
    <button
      type="button"
      className="group relative flex shrink-0 items-center justify-center rounded-xl border border-[#E5E7EB] bg-white shadow-sm transition hover:border-[#D1D5DB] hover:shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--nashlo-orange)/0.4)]"
      style={{ width: containerSize, height: containerSize }}
      aria-label={`${badge.label}: ${badge.description ?? ""}`}
      aria-describedby={open ? tooltipId : undefined}
      onClick={onOpen}
      onMouseEnter={() => {
        if (window.matchMedia("(hover: hover)").matches) onOpen()
      }}
      onMouseLeave={() => {
        if (window.matchMedia("(hover: hover)").matches) onClose()
      }}
    >
      {!broken && src ? (
        <img
          src={src}
          alt=""
          width={imgSize}
          height={imgSize}
          className="block object-contain"
          onError={onImgError}
        />
      ) : (
        <span className="text-[10px] font-bold text-zinc-500">
          {badge.label.slice(0, 1)}
        </span>
      )}
    </button>
  )
}

const SCROLL_TILE = 48
const SCROLL_IMG = 26

function BadgeScrollTile({
  badge,
  open,
  tooltipId,
  onToggle,
}: {
  badge: UserBadge
  open: boolean
  tooltipId: string
  onToggle: () => void
}) {
  const [broken, setBroken] = useState(false)
  const [src, setSrc] = useState(badge.icon ?? "")

  function onImgError() {
    const code = badge.id as BadgeCode
    const staticUrl = `/badges/${badgeAssetFile(code)}`
    if (src !== staticUrl) {
      setSrc(staticUrl)
      return
    }
    setBroken(true)
  }

  return (
    <button
      type="button"
      className="group flex shrink-0 flex-col items-center gap-1 transition active:scale-[0.97]"
      aria-label={`${badge.label}: ${badge.description ?? ""}`}
      aria-describedby={open ? tooltipId : undefined}
      onClick={onToggle}
    >
      <span
        className={cn(
          "flex items-center justify-center rounded-2xl border bg-gradient-to-b from-white to-zinc-50 shadow-[0_1px_4px_rgba(15,23,42,0.06)] transition",
          open
            ? "border-[hsl(var(--nashlo-orange)/0.45)] ring-2 ring-[hsl(var(--nashlo-orange)/0.15)]"
            : "border-zinc-200/90 group-hover:border-zinc-300 group-hover:shadow-md",
        )}
        style={{ width: SCROLL_TILE, height: SCROLL_TILE }}
      >
        {!broken && src ? (
          <img
            src={src}
            alt=""
            width={SCROLL_IMG}
            height={SCROLL_IMG}
            className="object-contain"
            onError={onImgError}
          />
        ) : (
          <span className="text-xs font-bold text-zinc-500">{badge.label.slice(0, 1)}</span>
        )}
      </span>
      <span className="max-w-[56px] truncate text-[10px] font-medium text-zinc-500">{badge.label}</span>
    </button>
  )
}

function BadgeChip({
  badge,
  onOpen,
  onClose,
  open,
  tooltipId,
}: {
  badge: UserBadge
  onOpen: () => void
  onClose: () => void
  open: boolean
  tooltipId: string
}) {
  const [broken, setBroken] = useState(false)
  const [src, setSrc] = useState(badge.icon ?? "")

  function onImgError() {
    const code = badge.id as BadgeCode
    const staticUrl = `/badges/${badgeAssetFile(code)}`
    if (src !== staticUrl) {
      setSrc(staticUrl)
      return
    }
    setBroken(true)
  }

  return (
    <button
      type="button"
      title={badge.description}
      aria-label={badge.description}
      aria-describedby={open ? tooltipId : undefined}
      onClick={onOpen}
      onMouseEnter={() => {
        if (window.matchMedia("(hover: hover)").matches) onOpen()
      }}
      onMouseLeave={() => {
        if (window.matchMedia("(hover: hover)").matches) onClose()
      }}
      className={cn(
        "inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 text-left text-xs font-semibold transition hover:brightness-[0.98]",
        badge.color,
      )}
    >
      {!broken && src ? (
        <img
          src={src}
          alt=""
          width={16}
          height={16}
          className="shrink-0 object-contain"
          onError={onImgError}
        />
      ) : (
        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-white/60 text-[9px] font-bold">
          {badge.label.slice(0, 1)}
        </span>
      )}
      <span className="truncate">{badge.label}</span>
    </button>
  )
}

export function UserBadges({
  badges,
  max,
  size = "sm",
  variant = "icons",
  showLabels = false,
  className,
}: Props) {
  const visible = toVisibleUserBadges(badges, max)
  const [openId, setOpenId] = useState<string | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const tooltipId = useId()

  useEffect(() => {
    function onDoc(e: MouseEvent | TouchEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpenId(null)
    }
    document.addEventListener("mousedown", onDoc)
    document.addEventListener("touchstart", onDoc)
    return () => {
      document.removeEventListener("mousedown", onDoc)
      document.removeEventListener("touchstart", onDoc)
    }
  }, [])

  if (!visible.length) return null

  const openBadge = visible.find((b) => b.id === openId)

  if (variant === "scrollRow") {
    return (
      <div ref={rootRef} className={cn("relative", className)}>
        <div className="-mx-1 flex gap-2.5 overflow-x-auto px-1 pb-0.5 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {visible.map((badge) => (
            <BadgeScrollTile
              key={badge.id}
              badge={badge}
              tooltipId={tooltipId}
              open={openId === badge.id}
              onToggle={() => setOpenId((c) => (c === badge.id ? null : badge.id))}
            />
          ))}
        </div>
        {openBadge?.description && openId && (
          <div
            id={tooltipId}
            role="tooltip"
            className="absolute left-0 top-full z-50 mt-2 w-[min(16rem,calc(100vw-2rem))] rounded-xl border border-zinc-200/80 bg-white/95 p-3 text-xs leading-relaxed text-zinc-600 shadow-lg backdrop-blur-sm"
          >
            <p className="font-semibold text-zinc-950">{openBadge.label}</p>
            <p className="mt-1">{openBadge.description}</p>
          </div>
        )}
      </div>
    )
  }

  if (variant === "chips") {
    return (
      <div ref={rootRef} className={cn("relative", className)}>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          {visible.map((badge) => (
            <BadgeChip
              key={badge.id}
              badge={badge}
              tooltipId={tooltipId}
              open={openId === badge.id}
              onOpen={() => setOpenId(badge.id)}
              onClose={() => setOpenId((c) => (c === badge.id ? null : c))}
            />
          ))}
        </div>
        {openBadge?.description && openId && (
          <div
            id={tooltipId}
            role="tooltip"
            className="absolute left-0 top-full z-50 mt-2 w-[min(16rem,calc(100vw-2rem))] rounded-xl border border-zinc-200 bg-white p-3 text-xs leading-relaxed text-zinc-600 shadow-lg"
          >
            <p className="font-semibold text-zinc-950">{openBadge.label}</p>
            <p className="mt-1">{openBadge.description}</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div ref={rootRef} className={cn("relative inline-flex flex-wrap items-center gap-1.5", className)}>
      {visible.map((badge) => (
        <div
          key={badge.id}
          className={cn("inline-flex items-center gap-1.5", showLabels && "flex-col sm:flex-row")}
        >
          <BadgeIcon
            badge={badge}
            size={size}
            tooltipId={tooltipId}
            open={openId === badge.id}
            onOpen={() => setOpenId(badge.id)}
            onClose={() => setOpenId((c) => (c === badge.id ? null : c))}
          />
          {showLabels && (
            <div className="min-w-0 text-left">
              <p className="text-sm font-semibold text-zinc-900">{badge.label}</p>
              {badge.description && (
                <p className="line-clamp-2 text-xs text-zinc-500">{badge.description}</p>
              )}
            </div>
          )}
        </div>
      ))}

      {openBadge?.description && openId && (
        <div
          id={tooltipId}
          role="tooltip"
          className="absolute left-0 top-full z-50 mt-2 w-[min(16rem,calc(100vw-2rem))] rounded-xl border border-zinc-200 bg-white p-3 text-xs leading-relaxed text-zinc-600 shadow-lg"
        >
          <p className="font-semibold text-zinc-950">{openBadge.label}</p>
          <p className="mt-1">{openBadge.description}</p>
        </div>
      )}
    </div>
  )
}
