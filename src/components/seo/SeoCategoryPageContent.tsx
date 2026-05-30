import { CategoryPage } from "@/components/marketplace/CategoryPage"
import {
  getIndexedCityPagesForSitemap,
  getSeoCategoryListingCount,
  getSeoCategoryRecentListings,
  resolveSeoCategoryPageState,
} from "@/lib/seo/collections"
import { getSeoCategoryPath, toSeoSegment } from "@/lib/seo/categories"
import { getCategorySeoPath } from "@/lib/seo/paths"
import { buildCollectionPageJsonLd } from "@/lib/seo/jsonld"
import { SeoCategoryFooter } from "@/components/seo/SeoCategoryFooter"

type Props = {
  categorySlug: string
  segment?: string
  citySegment?: string
}

export async function SeoCategoryPageContent({ categorySlug, segment, citySegment }: Props) {
  const state = await resolveSeoCategoryPageState(categorySlug, segment, citySegment)
  const [listingCount, recentListings, popularCities] = await Promise.all([
    getSeoCategoryListingCount(state.internalCategorySlug, state.fixedParams, state.initialCity),
    getSeoCategoryRecentListings(state.internalCategorySlug, 6, state.initialCity),
    getIndexedCityPagesForSitemap(categorySlug),
  ])
  const jsonLd = buildCollectionPageJsonLd({
    title: state.title,
    description: state.description,
    path: state.canonicalPath,
    breadcrumbs: state.breadcrumbs.map((crumb) => ({
      label: crumb.label,
      href: crumb.href,
    })),
  })

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CategoryPage
        category={state.internalCategorySlug}
        title={state.title}
        links={state.links}
        fixedParams={state.fixedParams}
        initialCity={state.initialCity}
        hideCityFilter={state.hideCityFilter}
        breadcrumbs={state.breadcrumbs}
        scopeLabel={state.scopeLabel}
        quickLinks={
          state.config.children.length
            ? [
                { label: "Все", href: getSeoCategoryPath(state.config.slug) },
                ...state.config.children.map((child) => ({
                  label: child.label,
                  href: getSeoCategoryPath(state.config.slug, child.slug),
                })),
              ]
            : undefined
        }
        activeQuickLinkHref={state.path}
      />
      <SeoCategoryFooter
        state={state}
        listingCount={listingCount}
        popularCities={popularCities.map((c) => ({
          city: c.city,
          href: getCategorySeoPath(categorySlug, toSeoSegment(c.city)),
        }))}
        recentListingHrefs={recentListings}
      />
    </>
  )
}
