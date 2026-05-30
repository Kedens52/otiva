import { permanentRedirect } from "next/navigation"

/** Старые SEO-сегменты категории marketplace «Бизнес» → поиск */
export default function BiznesSegmentLegacyRedirect({ params }: { params: { segment: string } }) {
  permanentRedirect(`/search?cat=business&q=${encodeURIComponent(params.segment)}`)
}
