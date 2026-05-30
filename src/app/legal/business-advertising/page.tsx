import type { Metadata } from "next"
import { LegalPageShell } from "@/components/legal/LegalPageShell"
import { buildPageMetadata } from "@/lib/seo/site"
import Link from "next/link"

export const metadata: Metadata = buildPageMetadata({
  title: "Реклама для бизнеса — Нашло Бизнес",
  description: "Размещение рекламы и продвижение B2B-предложений на Нашло Бизнес.",
  path: "/legal/business-advertising",
})

export default function BusinessAdvertisingLegalPage() {
  return (
    <LegalPageShell title="Реклама для бизнеса" description="Правила рекламы в разделе Нашло Бизнес.">
      <p>
        Рекламные форматы для компаний на B2B-площадке регулируются общими{" "}
        <Link href="/legal/advertising-rules" className="underline">
          правилами рекламы
        </Link>{" "}
        и условиями раздела Нашло Бизнес.
      </p>
      <p className="mt-3">
        <Link href="/advertising" className="font-semibold text-[hsl(var(--nashlo-orange))] underline">
          Подробнее о рекламе на Нашло
        </Link>
      </p>
    </LegalPageShell>
  )
}
