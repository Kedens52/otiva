import type { Metadata } from "next"
import { WANT_TO_BUY_SECTION_LABEL } from "@/config/want-to-buy-brand"
import { SITE_NAME } from "@/lib/seo/site"

export const metadata: Metadata = {
  title: {
    default: `${WANT_TO_BUY_SECTION_LABEL} | ${SITE_NAME}`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "Заявки покупателей на Нашло: оставьте запрос «Куплю» или смотрите, что ищут — и предложите свой товар.",
}

export default function KypluLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-[60vh] bg-[#ECECEC]">{children}</div>
}
