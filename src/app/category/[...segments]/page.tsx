import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { SeoCategoryPageContent } from "@/components/seo/SeoCategoryPageContent"
import { buildSeoCategoryMetadata, resolveSeoCategoryPageState } from "@/lib/seo/collections"
import { resolveCategoryRouteSegments } from "@/lib/seo/resolve-category-segments"
import { getCategorySeoPath } from "@/lib/seo/paths"
import { getFilterIndexingDecision } from "@/lib/seo/filter-indexing"
import { buildPageMetadata } from "@/lib/seo/site"

type Props = {
  params: { segments: string[] }
  searchParams: Record<string, string | string[] | undefined>
}

export const revalidate = 3600

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const resolved = resolveCategoryRouteSegments(params.segments)
  if (!resolved) notFound()

  const segment = resolved.segment
  const citySegment = resolved.citySegment

  const canonicalBase =
    segment && citySegment
      ? getCategorySeoPath(resolved.categorySlug, segment, citySegment)
      : getCategorySeoPath(resolved.categorySlug, segment ?? citySegment)

  const decision = getFilterIndexingDecision({
    categoryCanonicalPath: canonicalBase,
    searchParams,
  })

  if (decision.noindex) {
    const state = await resolveSeoCategoryPageState(resolved.categorySlug, segment, citySegment)
    return buildPageMetadata({
      title: `${state.title} | Нашло`,
      description: state.description,
      path: state.canonicalPath,
      canonicalPath: decision.canonicalPath,
      noindex: true,
    })
  }

  return buildSeoCategoryMetadata(resolved.categorySlug, segment, citySegment)
}

export default async function CategorySegmentsPage({ params }: Props) {
  const resolved = resolveCategoryRouteSegments(params.segments)
  if (!resolved) notFound()

  return (
    <SeoCategoryPageContent
      categorySlug={resolved.categorySlug}
      segment={resolved.segment}
      citySegment={resolved.citySegment}
    />
  )
}
