import { notFound } from "next/navigation"
import { BusinessBreadcrumbs } from "@/components/business/BusinessBreadcrumbs"
import { JsonLdScripts } from "@/components/business/JsonLdScripts"
import { CompanyPublicPage } from "@/components/business/public/CompanyPublicPage"
import { businessCompanyJsonLd } from "@/lib/business/jsonld"
import { getPublicCompanyBySlug, companyPublicPath } from "@/lib/business/get-public-company"
import { BUSINESS_BRAND } from "@/lib/business/config"
import { absoluteUrl, buildPageMetadata } from "@/lib/seo/site"

type Props = { params: { slug: string } }

export async function generateMetadata({ params }: Props) {
  const data = await getPublicCompanyBySlug(params.slug)
  if (!data) return { title: "Не найдено", robots: { index: false, follow: false } }
  const { company } = data
  const path = companyPublicPath(company)
  const desc =
    company.shortDescription ??
    company.description?.slice(0, 160) ??
    `${company.name}: предложения, каталог, оптовые условия и контакты на Нашло Бизнес.`
  return buildPageMetadata({
    title: `${company.name} — компания на Нашло Бизнес`,
    description: desc,
    path,
    canonicalPath: path,
  })
}

export default async function BusinessCompanyPublicRoute({ params }: Props) {
  const data = await getPublicCompanyBySlug(params.slug)
  if (!data) notFound()

  const { company, profileCompleteness, reviews, reviewAverage, reviewCount } = data
  const path = companyPublicPath(company)

  return (
    <>
      <JsonLdScripts
        data={businessCompanyJsonLd({
          name: company.name,
          description: company.shortDescription ?? company.description,
          city: company.city,
          url: absoluteUrl(path),
          websiteUrl: company.showWebsitePublicly ? company.websiteUrl : null,
        })}
      />
      <BusinessBreadcrumbs
        items={[
          { name: "Главная", href: "/" },
          { name: BUSINESS_BRAND, href: "/business" },
          { name: "Компании", href: "/business/companies" },
          { name: company.name, href: path },
        ]}
      />
      <CompanyPublicPage
        company={company}
        profileCompleteness={profileCompleteness}
        reviews={reviews}
        reviewAverage={reviewAverage}
        reviewCount={reviewCount}
      />
    </>
  )
}
