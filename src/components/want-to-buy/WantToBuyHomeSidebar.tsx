import Link from "next/link"
import { ArrowRight, CheckCircle2, ShieldCheck, ShoppingBag, Tag } from "lucide-react"
import { AdSlot } from "@/components/marketplace/AdSlot"
import { getWantToBuySearchPath } from "@/lib/want-to-buy/routes"

const sellerTips = [
  "Откликайтесь в первые часы после публикации",
  "Укажите цену и состояние товара",
  "Приложите ссылку на своё объявление",
]

const safetyTips = [
  "Не переводите предоплату до встречи",
  "Проверяйте товар перед сделкой",
  "Общайтесь через чат Нашло",
]

const sideCard = "rounded-[16px] border border-[#E5E7EB] bg-white p-4"

export function WantToBuyHomeSidebar() {
  return (
    <aside className="hidden w-[260px] shrink-0 space-y-3 lg:block">
      <AdSlot slot="sidebarTop" />
      <AdSlot slot="sidebarTall" />

      <div className={sideCard}>
        <div className="mb-2.5 flex items-center gap-2">
          <ShoppingBag className="h-5 w-5 shrink-0 text-[#FF5A00]" />
          <h3 className="text-sm font-semibold text-[#111827]">Для продавцов</h3>
        </div>
        <p className="text-sm leading-relaxed text-[#6B7280]">
          Нашли заявку покупателя — предложите свой товар одним откликом.
        </p>
        <Link
          href={getWantToBuySearchPath({ sort: "no_offers" })}
          className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#FF5A00] hover:underline"
        >
          Заявки без откликов <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className={sideCard}>
        <div className="mb-3 flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-[9px] bg-[#FFF3EC] text-[#FF5A00]">
            <ShieldCheck className="h-4 w-4" />
          </span>
          <h3 className="text-sm font-semibold text-[#111827]">Безопасность</h3>
        </div>
        <ul className="space-y-2">
          {safetyTips.map((tip) => (
            <li key={tip} className="flex gap-2 text-sm leading-5 text-[#6B7280]">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#FF5A00]" />
              {tip}
            </li>
          ))}
        </ul>
        <Link
          href="/safety"
          className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#FF5A00] hover:underline"
        >
          Подробнее <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className={sideCard}>
        <div className="mb-3 flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-[9px] bg-[#FFF3EC] text-[#FF5A00]">
            <Tag className="h-4 w-4" />
          </span>
          <h3 className="text-sm font-semibold text-[#111827]">Как продать быстрее</h3>
        </div>
        <ul className="space-y-2">
          {sellerTips.map((tip) => (
            <li key={tip} className="text-sm leading-5 text-[#6B7280]">
              {tip}
            </li>
          ))}
        </ul>
        <Link
          href="/create"
          className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#FF5A00] hover:underline"
        >
          Разместить объявление <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </aside>
  )
}
