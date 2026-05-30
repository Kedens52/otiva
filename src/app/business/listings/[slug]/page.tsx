import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { absoluteUrl, buildPageMetadata } from "@/lib/seo/site"
import { BusinessBreadcrumbs } from "@/components/business/BusinessBreadcrumbs"
import { JsonLdScripts } from "@/components/business/JsonLdScripts"
import { BusinessListingDetailView } from "@/components/business/public/BusinessListingDetailView"
import { businessListingJsonLd } from "@/lib/business/jsonld"
import { companyPublicPath } from "@/lib/business/get-public-company"
import { BUSINESS_BRAND } from "@/lib/business/config"

type Props = { params: { slug: string } }

export async function generateMetadata({ params }: Props) {
  const listing = await prisma.businessListing.findFirst({
    where: { OR: [{ id: params.slug }, { slug: params.slug }], status: "ACTIVE" },
    select: { title: true, description: true, slug: true, id: true },
  })
  if (!listing) return { title: "Не найдено" }
  const path = `/business/listings/${listing.slug ?? listing.id}`
  return buildPageMetadata({
    title: `${listing.title} — Нашло Бизнес`,
    description: listing.description.slice(0, 160),
    path,
    canonicalPath: path,
  })
}

export default async function BusinessListingDetailPage({ params }: Props) {
  const listing = await prisma.businessListing.findFirst({
    where: {
      OR: [{ id: params.slug }, { slug: params.slug }],
      status: "ACTIVE",
      company: { verificationStatus: "VERIFIED", isBlocked: false, isPublic: true },
    },
    include: {
      company: {
        select: { id: true, name: true, publicSlug: true, verificationStatus: true },
      },
    },
  })

  if (!listing) notFound()

  const path = `/business/listings/${listing.slug ?? listing.id}`
  const companyPath = companyPublicPath(listing.company)

  await prisma.businessListing
    .update({ where: { id: listing.id }, data: { views: { increment: 1 } } })
    .catch(() => {})

  return (
    <>
      <JsonLdScripts
        data={businessListingJsonLd({
          title: listing.title,
          description: listing.description,
          price: listing.priceFrom ?? listing.price,
          currency: listing.currency,
          url: absoluteUrl(path),
          companyName: listing.company.name,
          companyUrl: absoluteUrl(companyPath),
          isService: listing.type === "SERVICE_FOR_BUSINESS",
          city: listing.city,
        })}
      />
      <BusinessBreadcrumbs
        items={[
          { name: "Главная", href: "/" },
          { name: BUSINESS_BRAND, href: "/business" },
          { name: "Объявления", href: "/business/listings" },
          { name: listing.title, href: path },
        ]}
      />
      <BusinessListingDetailView listing={listing} />
      <p className="mt-6 rounded-xl border border-amber-100 bg-amber-50/60 px-4 py-3 text-sm text-amber-950">
        Перед сделкой проверьте документы компании и условия поставки. Нашло не является стороной B2B-договора.
      </p>
    </>
  )
}
