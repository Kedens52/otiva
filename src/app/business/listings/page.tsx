import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { formatPrice } from "@/lib/listing-types"
import { buildBusinessListingsIndexMetadata } from "@/lib/business/seo"
import { BusinessBreadcrumbs } from "@/components/business/BusinessBreadcrumbs"
import { JsonLdScripts } from "@/components/business/JsonLdScripts"
import { businessCollectionPageJsonLd } from "@/lib/business/jsonld"
import { BUSINESS_BRAND } from "@/lib/business/config"

export const generateMetadata = () => buildBusinessListingsIndexMetadata()

export default async function BusinessListingsPage() {
  const listings = await prisma.businessListing.findMany({
    where: {
      status: "ACTIVE",
      company: { verificationStatus: "VERIFIED", isBlocked: false },
    },
    include: { company: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 48,
  })

  return (
    <>
      <JsonLdScripts
        data={businessCollectionPageJsonLd({
          title: "B2B-объявления — Нашло Бизнес",
          description:
            "Каталог B2B-объявлений: опт, оборудование, продажа бизнеса, франшизы и услуги для компаний.",
          path: "/business/listings",
          breadcrumbs: [
            { name: "Главная", href: "/" },
            { name: BUSINESS_BRAND, href: "/business" },
            { name: "B2B-объявления", href: "/business/listings" },
          ],
        })}
      />
      <BusinessBreadcrumbs
        items={[
          { name: "Главная", href: "/" },
          { name: BUSINESS_BRAND, href: "/business" },
          { name: "B2B-объявления", href: "/business/listings" },
        ]}
      />
      <h1 className="text-2xl font-bold text-zinc-950">B2B-объявления</h1>
      <p className="mt-2 text-zinc-600">Активные предложения от проверенных компаний.</p>
      <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {listings.map((item) => (
          <li key={item.id}>
            <Link
              href={`/business/listings/${item.slug ?? item.id}`}
              className="block rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm hover:border-[hsl(var(--nashlo-orange)/0.35)]"
            >
              <p className="font-semibold">{item.title}</p>
              <p className="mt-1 text-lg font-bold">{formatPrice(item.price)}</p>
              <p className="text-sm text-zinc-500">{item.company.name}</p>
            </Link>
          </li>
        ))}
      </ul>
    </>
  )
}
