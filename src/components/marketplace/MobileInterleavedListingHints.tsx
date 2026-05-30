"use client"

import type { ReactNode } from "react"
import { Fragment, useMemo } from "react"
import { MobileNashloHintCard } from "@/components/marketplace/MobileNashloHintCard"
import {
  hintVariantPool,
  isHintDismissedSession,
  mobileNashloHintSessionKey,
  type NashloMobileHintVariant,
} from "@/lib/mobile-nashlo-hints"

type MobileInterleavedListingHintsProps<T extends { id: string }> = {
  listings: T[]
  renderItem: (item: T) => ReactNode
  scopePrefix: string
  sectionIndex: number
  maxHintsThisSection: number
  hasActiveListings: boolean | null
}

function pickVariantForSlot(
  pool: NashloMobileHintVariant[],
  hasActiveListings: boolean | null,
  scopePrefix: string,
  sectionIndex: number,
  slotInSection: number,
): NashloMobileHintVariant | null {
  for (const v of pool) {
    if (v === 2 && hasActiveListings !== true) continue
    const key = mobileNashloHintSessionKey(`${scopePrefix}-sec${sectionIndex}`, v, slotInSection)
    if (!isHintDismissedSession(key)) return v
  }
  return null
}

/**
 * Подсказки только на мобильной сетке (внутри карточки — lg:hidden).
 */
export function MobileInterleavedListingHints<T extends { id: string }>({
  listings,
  renderItem,
  scopePrefix,
  sectionIndex,
  maxHintsThisSection,
  hasActiveListings,
}: MobileInterleavedListingHintsProps<T>) {
  const pool = useMemo(() => hintVariantPool(hasActiveListings), [hasActiveListings])

  if (maxHintsThisSection <= 0 || listings.length < 6) {
    return <>{listings.map((item) => <Fragment key={item.id}>{renderItem(item)}</Fragment>)}</>
  }

  const insertAfter: number[] = []
  if (listings.length >= 6) insertAfter.push(5)
  if (listings.length >= 13 && maxHintsThisSection > 1) insertAfter.push(12)

  const out: ReactNode[] = []
  let placed = 0

  for (let i = 0; i < listings.length; i++) {
    out.push(<Fragment key={listings[i].id}>{renderItem(listings[i])}</Fragment>)

    if (placed < maxHintsThisSection && insertAfter.includes(i)) {
      const variant = pickVariantForSlot(pool, hasActiveListings, scopePrefix, sectionIndex, placed)
      if (variant != null) {
        out.push(
          <MobileNashloHintCard
            key={`hint-${scopePrefix}-sec${sectionIndex}-i${i}-v${variant}`}
            variant={variant}
            scope={`${scopePrefix}-sec${sectionIndex}`}
            slot={placed}
          />,
        )
        placed += 1
      }
    }
  }

  return <>{out}</>
}

export function feedSectionHintBudget(
  recommendedLen: number,
  latestLen: number,
): { first: number; second: number } {
  const firstCap = recommendedLen >= 13 ? 2 : recommendedLen >= 6 ? 1 : 0
  const secondCapRaw = latestLen >= 13 ? 2 : latestLen >= 6 ? 1 : 0
  const remaining = Math.max(0, 2 - firstCap)
  const second = Math.min(secondCapRaw, remaining)
  return { first: firstCap, second: second }
}

/** Одна сетка (поиск, категория): не более 2 подсказок, после 6 и 13 карточек. */
export function singleSectionHintBudget(len: number): number {
  if (len < 6) return 0
  if (len >= 13) return 2
  return 1
}
