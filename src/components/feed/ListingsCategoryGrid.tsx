"use client"

import { CategoryPlaqueGrid, type CategoryPlaqueItem } from "@/components/marketplace/CategoryPlaqueGrid"
import { CATEGORY_META } from "@/lib/listing-types"
import { getListingCategoryHint } from "@/lib/listings/category-card-details"
import {
  getListingCategoryIcon,
  HOME_LISTING_CATEGORY_SLUGS,
  LISTING_CATEGORY_BG,
} from "@/lib/listings/category-display"
import { trackUserInterest } from "@/lib/recommendations"

export function ListingsCategoryGrid() {
  const items: CategoryPlaqueItem[] = HOME_LISTING_CATEGORY_SLUGS.map((slug) => {
    const meta = CATEGORY_META.find((m) => m.slug === slug)
    if (!meta) return null
    return {
      slug,
      title: meta.title,
      hint: getListingCategoryHint(slug),
      href: meta.href,
      bg: LISTING_CATEGORY_BG[slug] ?? "#F3F4F6",
      icon: getListingCategoryIcon(slug),
      onClick: () => trackUserInterest({ category: slug, weight: 3 }),
    }
  }).filter((x): x is CategoryPlaqueItem => x !== null)

  return (
    <CategoryPlaqueGrid
      heading="Что ищете?"
      subheading="Выберите раздел — объявления по категориям"
      allCategoriesHref="/categories"
      items={items}
      ariaLabel="Категории объявлений"
      accentClassName="text-[#FF4F12]"
    />
  )
}
