import { JsonLdScripts } from "@/components/business/JsonLdScripts"
import { buildCollectionPageJsonLd, type BreadcrumbLdItem } from "@/lib/seo/jsonld"

type Props = {
  title: string
  description: string
  path: string
  breadcrumbs: BreadcrumbLdItem[]
}

export function WantToBuyCollectionJsonLd({ title, description, path, breadcrumbs }: Props) {
  return <JsonLdScripts data={buildCollectionPageJsonLd({ title, description, path, breadcrumbs })} />
}
