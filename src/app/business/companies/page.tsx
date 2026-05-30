import Link from "next/link"
import Image from "next/image"
import { prisma } from "@/lib/prisma"
import { BadgeCheck, Building2 } from "lucide-react"
import { buildBusinessCompaniesMetadata } from "@/lib/business/seo"
import { BusinessBreadcrumbs } from "@/components/business/BusinessBreadcrumbs"
import { JsonLdScripts } from "@/components/business/JsonLdScripts"
import { businessCollectionPageJsonLd } from "@/lib/business/jsonld"
import { BUSINESS_BRAND } from "@/lib/business/config"
import { companyPublicPath } from "@/lib/business/get-public-company"

export const generateMetadata = () => buildBusinessCompaniesMetadata()

export default async function BusinessCompaniesPage() {
  const items = await prisma.company.findMany({
    where: {
      isPublic: true,
      verificationStatus: "VERIFIED",
      isBlocked: false,
      listings: { some: { status: "ACTIVE" } },
    },
    select: {
      id: true,
      name: true,
      city: true,
      industry: true,
      businessRole: true,
      publicSlug: true,
      shortDescription: true,
      logoUrl: true,
      _count: { select: { listings: { where: { status: "ACTIVE" } } } },
    },
    orderBy: { profileCompleteness: "desc" },
    take: 48,
  })

  return (
    <>
      <JsonLdScripts
        data={businessCollectionPageJsonLd({
          title: "Каталог компаний — Нашло Бизнес",
          description: "Проверенные компании, поставщики и закупщики на B2B-площадке Нашло Бизнес.",
          path: "/business/companies",
          breadcrumbs: [
            { name: "Главная", href: "/" },
            { name: BUSINESS_BRAND, href: "/business" },
            { name: "Компании", href: "/business/companies" },
          ],
        })}
      />
      <BusinessBreadcrumbs
        items={[
          { name: "Главная", href: "/" },
          { name: BUSINESS_BRAND, href: "/business" },
          { name: "Компании", href: "/business/companies" },
        ]}
      />
      <h1 className="text-2xl font-bold text-zinc-950">Каталог компаний</h1>
      <p className="mt-1 text-sm text-zinc-500">Проверенные B2B-компании с активными предложениями</p>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((c) => (
          <li key={c.id}>
            <div className="flex h-full flex-col rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-zinc-100">
                  {c.logoUrl ? (
                    <Image src={c.logoUrl} alt="" fill className="object-cover" sizes="48px" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Building2 className="h-5 w-5 text-zinc-400" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="flex items-center gap-1 font-semibold text-zinc-950">
                    <BadgeCheck className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
                    <span className="truncate">{c.name}</span>
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    {c.city}
                    {c.industry ? ` · ${c.industry}` : ""}
                  </p>
                </div>
              </div>
              {c.shortDescription && (
                <p className="mt-3 line-clamp-2 text-sm text-zinc-600">{c.shortDescription}</p>
              )}
              <p className="mt-2 text-xs text-zinc-400">{c._count.listings} предложений</p>
              <div className="mt-auto flex gap-2 pt-4">
                <Link
                  href={companyPublicPath(c)}
                  className="flex-1 rounded-xl bg-zinc-950 py-2 text-center text-xs font-semibold text-white"
                >
                  Профиль
                </Link>
                <Link
                  href={`${companyPublicPath(c)}#catalog`}
                  className="rounded-xl border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-700"
                >
                  Прайс
                </Link>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </>
  )
}
