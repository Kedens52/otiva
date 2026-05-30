import { generateJsonLd } from "@/lib/seo/jsonld"

export function HomeJsonLd() {
  const jsonLd = generateJsonLd("home", {})
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}
