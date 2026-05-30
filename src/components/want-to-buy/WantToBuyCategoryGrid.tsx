"use client"

import { CategoryPlaqueGrid, type CategoryPlaqueItem } from "@/components/marketplace/CategoryPlaqueGrid"
import type { WantToBuyCategoryOption } from "@/lib/want-to-buy/client-types"
import { getWantToBuyCategoryHint } from "@/lib/want-to-buy/category-card-details"
import {
  getWantToBuyBuyLabel,
  getWantToBuyCategoryIcon,
  WANT_TO_BUY_CATEGORY_BG,
} from "@/lib/want-to-buy/category-display"
import {
  getWantToBuyCategoriesPath,
  getWantToBuyCategoryPath,
} from "@/lib/want-to-buy/routes"

type WantToBuyCategoryGridProps = {
  categories: WantToBuyCategoryOption[]
}

const FEATURED_SLUGS = [
  "electronics",
  "cars",
  "real-estate",
  "home",
  "fashion",
  "services",
  "parts",
  "animals",
  "hobby",
  "kids",
  "sport",
  "goods",
] as const

export function WantToBuyCategoryGrid({ categories }: WantToBuyCategoryGridProps) {
  const items: CategoryPlaqueItem[] = categories.map((c) => ({
    slug: c.slug,
    title: getWantToBuyBuyLabel(c.slug, c.nameRu),
    hint: getWantToBuyCategoryHint(c.slug),
    href: getWantToBuyCategoryPath(c.slug),
    bg: WANT_TO_BUY_CATEGORY_BG[c.slug] ?? "#F3F4F6",
    icon: getWantToBuyCategoryIcon(c.slug),
  }))

  const sorted = [
    ...items.filter((c) => FEATURED_SLUGS.includes(c.slug as (typeof FEATURED_SLUGS)[number])),
    ...items.filter((c) => !FEATURED_SLUGS.includes(c.slug as (typeof FEATURED_SLUGS)[number])),
  ]

  return (
    <CategoryPlaqueGrid
      heading="Категории"
      compact
      subheading="Выберите раздел"
      allCategoriesHref={getWantToBuyCategoriesPath()}
      items={sorted}
      ariaLabel="Категории заявок"
    />
  )
}
