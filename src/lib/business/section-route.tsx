import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { BusinessSectionPage } from "@/components/business/BusinessSectionPage"
import {
  buildBusinessSectionMetadata,
  BUSINESS_SEO_CITIES,
  type BusinessSectionSlug,
} from "@/lib/business/seo"

export function createSectionRootPage(section: BusinessSectionSlug) {
  return async function SectionRootPage() {
    return <BusinessSectionPage section={section} />
  }
}

export function createSectionRootMetadata(section: BusinessSectionSlug): Metadata {
  return buildBusinessSectionMetadata(section)
}

export function createSectionCityPage(section: BusinessSectionSlug) {
  return async function SectionCityPage({ params }: { params: { city: string } }) {
    if (!BUSINESS_SEO_CITIES.some((c) => c.slug === params.city)) notFound()
    return <BusinessSectionPage section={section} citySlug={params.city} />
  }
}

export function createSectionCityMetadata(section: BusinessSectionSlug) {
  return async function generateMetadata({
    params,
  }: {
    params: { city: string }
  }): Promise<Metadata> {
    if (!BUSINESS_SEO_CITIES.some((c) => c.slug === params.city)) {
      return { title: "Не найдено" }
    }
    return buildBusinessSectionMetadata(section, params.city)
  }
}
