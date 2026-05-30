import { buildBusinessHomeMetadata } from "@/lib/business/seo"
import { BusinessBreadcrumbs } from "@/components/business/BusinessBreadcrumbs"
import { JsonLdScripts } from "@/components/business/JsonLdScripts"
import { businessHomeJsonLd } from "@/lib/business/jsonld"
import { BUSINESS_BRAND } from "@/lib/business/config"
import { BusinessHomeContent } from "@/components/business/BusinessHomeContent"

export const generateMetadata = () => buildBusinessHomeMetadata()

export default function BusinessHomePage() {
  return (
    <>
      <JsonLdScripts data={businessHomeJsonLd()} />
      <BusinessBreadcrumbs
        items={[
          { name: "Главная", href: "/" },
          { name: BUSINESS_BRAND, href: "/business" },
        ]}
      />
      <BusinessHomeContent />
    </>
  )
}
