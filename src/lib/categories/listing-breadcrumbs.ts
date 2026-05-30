import { MARKETPLACE_CATEGORIES } from "@/lib/category-config"
import { WANT_TO_BUY_PUBLIC_BASE } from "@/config/want-to-buy-brand"
import { CATEGORY_FILTERS } from "@/lib/filters"
import { getSeoCategoryChild, getSeoCategoryConfig } from "@/lib/seo/categories"
import { getListingCategoryBreadcrumbPath } from "@/lib/seo/paths"

export type BreadcrumbItem = {
  label: string
  href: string | null
  current?: boolean
}

/** Resolve subcategory value → human-readable label using CATEGORY_FILTERS options */
function resolveSubcategoryLabel(
  categorySlug: string,
  subcategoryValue: string,
): string | null {
  const catFilters = CATEGORY_FILTERS[categorySlug]
  if (!catFilters) return null

  for (const field of catFilters.fields) {
    if (field.key !== "subcategory") continue
    if (field.type !== "select" && field.type !== "multi") continue
    const opt = field.options.find((o) => o.value === subcategoryValue)
    if (opt) return opt.label
  }
  return null
}

/**
 * Build a breadcrumb chain for a listing page.
 *
 * Result:
 *   Главная › Category › [Subcategory] › Listing title (current)
 */
export function getListingBreadcrumbs(params: {
  title: string
  categorySlug: string | null | undefined
  categoryNameRu: string | null | undefined
  subcategoryValue: string | null | undefined
  attributes?: Record<string, unknown> | null | undefined
}): BreadcrumbItem[] {
  const crumbs: BreadcrumbItem[] = [{ label: "Главная", href: "/" }]

  const slug = params.categorySlug

  if (slug) {
    const cat = MARKETPLACE_CATEGORIES.find((c) => c.slug === slug)
    const catLabel = params.categoryNameRu || cat?.title || slug
    const categorySeoPath = getListingCategoryBreadcrumbPath({
      categorySlug: slug,
      attributes: null,
    })
    const scopedSeoPath = getListingCategoryBreadcrumbPath({
      categorySlug: slug,
      attributes: params.attributes,
    })

    crumbs.push({
      label: catLabel,
      href: categorySeoPath,
    })

    if (scopedSeoPath !== categorySeoPath) {
      const parts = scopedSeoPath.replace(/^\/category\//, "").split("/")
      const seoCategorySlug = parts[0]
      const seoChildSlug = parts[1]
      const seoChild = seoCategorySlug && seoChildSlug
        ? getSeoCategoryChild(seoCategorySlug, seoChildSlug)
        : null
      const subLabel = seoChild?.label ?? (
        params.subcategoryValue
          ? resolveSubcategoryLabel(slug, params.subcategoryValue)
          : null
      )

      if (subLabel) {
        crumbs.push({
          label: subLabel,
          href: scopedSeoPath,
        })
      }
    }
  } else {
    // Fallback when no category
    crumbs.push({ label: "Объявления", href: "/search" })
  }

  // Current listing — no link, truncated label
  crumbs.push({ label: params.title, href: null, current: true })

  return crumbs
}

/** Страницы с собственными крошками (ListingBreadcrumbs) — глобальные не показываем. */
export function isSeoCategoryPath(pathname: string): boolean {
  const root = pathname.split("/").filter(Boolean)[0]
  return root ? Boolean(getSeoCategoryConfig(root)) : false
}

const LEGACY_CATEGORY_PATHS = new Set([
  "/cars",
  "/fashion",
  "/kids",
  "/sport",
  "/home",
  "/free",
  "/electronics",
  "/services",
  "/real-estate",
])

export function hasDedicatedBreadcrumbs(pathname: string): boolean {
  const path = pathname.split("?")[0] ?? ""
  if (path === WANT_TO_BUY_PUBLIC_BASE) return true
  if (/^\/listings\/[^/]+$/.test(path)) return true
  // Канонические категории: /category/electronics, /category/transport/...
  if (path === "/category" || path.startsWith("/category/")) return true
  // SEO-лендинги с CategoryPage
  if (/^\/s\/[^/]+$/.test(path)) return true
  // Корневые SEO-категории и подразделы: /electronics, /transport/passenger-cars
  if (isSeoCategoryPath(path)) return true
  const root = path.split("/").filter(Boolean)[0]
  if (root && isSeoCategoryPath(`/${root}`)) return true
  if (LEGACY_CATEGORY_PATHS.has(path)) return true
  return false
}

/** Крошки для CategoryPage без явного prop breadcrumbs. */
export function buildCategoryPageBreadcrumbs(categorySlug: string): BreadcrumbItem[] {
  const cat = MARKETPLACE_CATEGORIES.find((item) => item.slug === categorySlug)
  const label = cat?.title ?? categorySlug

  return [
    { label: "Главная", href: "/" },
    { label, href: null, current: true },
  ]
}
