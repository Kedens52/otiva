import type { Metadata } from "next"
import { WantToBuyHomePage } from "@/components/want-to-buy/WantToBuyHomePage"
import { JsonLdScripts } from "@/components/business/JsonLdScripts"
import { buildCollectionPageJsonLd } from "@/lib/seo/jsonld"
import {
  WANT_TO_BUY_HUB_SEO,
  buildWantToBuyHubMetadata,
} from "@/lib/seo/want-to-buy-metadata"
import { getWantToBuyHubPath } from "@/lib/want-to-buy/routes"

export const metadata: Metadata = buildWantToBuyHubMetadata()

function WantToBuyFeedJsonLd() {
  const path = getWantToBuyHubPath()
  const data = buildCollectionPageJsonLd({
    title: WANT_TO_BUY_HUB_SEO.jsonLdTitle,
    description: WANT_TO_BUY_HUB_SEO.jsonLdDescription,
    path,
    breadcrumbs: [
      { label: "Главная", href: "/" },
      { label: "Куплю", href: null },
    ],
  })
  return <JsonLdScripts data={data} />
}

export default function KypluHomePage() {
  return (
    <>
      <WantToBuyFeedJsonLd />
      <WantToBuyHomePage />
    </>
  )
}
