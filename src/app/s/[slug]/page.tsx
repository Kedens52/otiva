import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { CategoryPage } from "@/components/marketplace/CategoryPage"
import { PAGE_CONTAINER_WIDE_CLASS } from "@/components/layout/PageContainer"
import { getSeoLandingBySlug } from "@/lib/seo/landings"
import { prisma } from "@/lib/prisma"
import { buildPageMetadata } from "@/lib/seo/site"

type Props = { params: { slug: string } }

export const revalidate = 3600

async function loadLanding(slug: string) {
  const staticLanding = getSeoLandingBySlug(slug)
  if (staticLanding) return staticLanding

  try {
    const row = await prisma.seoLanding.findUnique({ where: { slug } })
    if (!row || !row.indexable) return null
    return {
      slug: row.slug,
      title: row.title,
      seoTitle: row.seoTitle ?? row.title,
      seoDescription: row.seoDescription ?? row.title,
      h1: row.h1 ?? row.title,
      seoText: row.seoText ?? "",
      categorySlug: row.categorySlug ?? "services",
      internalCategorySlug: row.internalCategorySlug ?? "services",
      city: row.city ?? undefined,
      fixedParams: (row.fixedParams as Record<string, string> | null) ?? undefined,
      indexable: row.indexable,
      priority: row.sitemapPriority,
      changefreq: "weekly" as const,
    }
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const landing = await loadLanding(params.slug)
  if (!landing) {
    return buildPageMetadata({
      title: "Страница не найдена | Нашло",
      description: "SEO-страница не найдена.",
      path: `/s/${params.slug}`,
      noindex: true,
    })
  }

  return buildPageMetadata({
    title: landing.seoTitle,
    description: landing.seoDescription,
    path: `/s/${landing.slug}`,
    canonicalPath: landing.slug ? `/s/${landing.slug}` : undefined,
    noindex: !landing.indexable,
  })
}

export default async function SeoLandingPage({ params }: Props) {
  const landing = await loadLanding(params.slug)
  if (!landing) notFound()

  return (
    <div>
      <CategoryPage
        category={landing.internalCategorySlug}
        title={landing.h1}
        fixedParams={landing.fixedParams}
        initialCity={landing.city}
        hideCityFilter={Boolean(landing.city)}
      />
      {landing.seoText ? (
        <section className={`${PAGE_CONTAINER_WIDE_CLASS} pb-10 pt-2 text-sm leading-relaxed text-zinc-600`}>
          <p>{landing.seoText}</p>
        </section>
      ) : null}
    </div>
  )
}
