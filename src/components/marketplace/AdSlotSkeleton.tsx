"use client"

import { getAdSlotAspectRatio, getAdSlotDefinition, type AdSlotId } from "@/lib/ad-store"

type Props = {
  slot: AdSlotId
  variant?: "leaderboard" | "mobileStrip" | "listingStrip" | "box" | "tall"
}

export function AdSlotSkeleton({ slot, variant: variantProp }: Props) {
  const slotDef = getAdSlotDefinition(slot)
  const variant = variantProp ?? slotDef.variant

  const rounded =
    variant === "mobileStrip" || variant === "listingStrip"
      ? "rounded-[16px]"
      : variant === "leaderboard"
        ? "rounded-3xl"
        : "rounded-2xl"

  return (
    <div
      className={`block w-full animate-pulse border border-zinc-200/80 bg-zinc-100/90 ${rounded}`}
      style={{ aspectRatio: getAdSlotAspectRatio(slotDef) }}
      aria-hidden
    />
  )
}
