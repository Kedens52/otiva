import { BUSINESS_SECTIONS, BUSINESS_SEO_CITIES } from "@/lib/business/seo"
import { SEO_CATEGORY_CONFIGS } from "@/lib/seo/categories"
import { getCategorySeoPath } from "@/lib/seo/paths"

export type SitemapNavLink = { href: string; label: string }

/** Канонические URL витрин /category/... */
export function marketplaceCategoryNavLinks(): SitemapNavLink[] {
  return SEO_CATEGORY_CONFIGS.flatMap((config) => [
    { href: getCategorySeoPath(config.slug), label: config.title },
    ...config.children.map((child) => ({
      href: getCategorySeoPath(config.slug, child.slug),
      label: `${config.label} — ${child.title}`,
    })),
  ])
}

/** Публичные разделы Нашло Бизнес (без кабинета). */
export function businessPublicNavLinks(): SitemapNavLink[] {
  const sectionLinks = Object.values(BUSINESS_SECTIONS).map((section) => ({
    href: section.path,
    label: section.h1,
  }))
  const cityLinks = Object.values(BUSINESS_SECTIONS).flatMap((section) =>
    BUSINESS_SEO_CITIES.map((city) => ({
      href: `${section.path}/${city.slug}`,
      label: `${section.h1} — ${city.name}`,
    })),
  )
  return [
    { href: "/business", label: "Нашло Бизнес" },
    { href: "/business/listings", label: "B2B-объявления" },
    { href: "/business/companies", label: "Каталог компаний" },
    { href: "/business/requests", label: "Заявки на закупку" },
    ...sectionLinks,
    ...cityLinks,
  ]
}
