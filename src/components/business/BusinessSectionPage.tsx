import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { formatPrice } from "@/lib/listing-types"
import {
  BUSINESS_SECTIONS,
  BUSINESS_SEO_CITIES,
  type BusinessSectionSlug,
} from "@/lib/business/seo"
import { BusinessBreadcrumbs } from "@/components/business/BusinessBreadcrumbs"
import { JsonLdScripts } from "@/components/business/JsonLdScripts"
import { businessSectionJsonLd } from "@/lib/business/jsonld"
import { BUSINESS_BRAND } from "@/lib/business/config"

type Props = {
  section: BusinessSectionSlug
  citySlug?: string
}

export async function BusinessSectionPage({ section, citySlug }: Props) {
  const cfg = BUSINESS_SECTIONS[section]
  const city = citySlug ? BUSINESS_SEO_CITIES.find((c) => c.slug === citySlug) : null

  const listings = await prisma.businessListing.findMany({
    where: {
      status: "ACTIVE",
      type: cfg.listingType as never,
      ...(city ? { city: { equals: city.name, mode: "insensitive" } } : {}),
      company: { verificationStatus: "VERIFIED", isBlocked: false },
    },
    include: {
      company: { select: { name: true, publicSlug: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 48,
  })

  const crumbs = [
    { name: "Главная", href: "/" },
    { name: BUSINESS_BRAND, href: "/business" },
    { name: cfg.h1, href: cfg.path },
    ...(city ? [{ name: city.name, href: `${cfg.path}/${city.slug}` }] : []),
  ]

  const h1 = city ? `${cfg.h1} в ${city.prepositional}` : cfg.h1
  const intro = city
    ? `Актуальные B2B-предложения в категории «${cfg.h1}» в ${city.prepositional}.`
    : cfg.description

  return (
    <>
      <JsonLdScripts data={businessSectionJsonLd(cfg, city?.slug, city?.name)} />
      <BusinessBreadcrumbs items={crumbs} />
      <h1 className="text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl">{h1}</h1>
      <p className="mt-2 max-w-2xl text-zinc-600">{intro}</p>

      {citySlug === undefined && (
        <div className="mt-4 flex flex-wrap gap-2">
          {BUSINESS_SEO_CITIES.map((c) => (
            <Link
              key={c.slug}
              href={`${cfg.path}/${c.slug}`}
              className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:border-[hsl(var(--nashlo-orange)/0.4)]"
            >
              {c.name}
            </Link>
          ))}
        </div>
      )}

      {listings.length === 0 ? (
        <p className="mt-10 rounded-2xl border border-dashed border-zinc-200 bg-white p-8 text-center text-zinc-500">
          Пока нет активных предложений{city ? ` в ${city.prepositional}` : ""}.{" "}
          <Link href="/business/create" className="font-semibold text-[hsl(var(--nashlo-orange))]">
            Разместить первым
          </Link>
        </p>
      ) : (
        <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((item) => (
            <li key={item.id}>
              <Link
                href={`/business/listings/${item.slug ?? item.id}`}
                className="block h-full rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-[hsl(var(--nashlo-orange)/0.35)]"
              >
                <p className="font-semibold text-zinc-950">{item.title}</p>
                <p className="mt-1 text-lg font-bold text-zinc-950">{formatPrice(item.price)}</p>
                <p className="mt-1 text-sm text-zinc-500">{item.company.name}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
