import Link from "next/link"
import { ArrowRight, ShoppingBag } from "lucide-react"
import { getWantToBuyHubPath } from "@/lib/want-to-buy/routes"

/** Блок на главной `/` — вход в зеркальный раздел. */
export function WantToBuyHomeBanner() {
  return (
    <section className="rounded-[16px] border border-[rgba(15,23,42,0.06)] bg-gradient-to-r from-white to-[#FFF8F4] px-4 py-4 shadow-sm sm:flex sm:items-center sm:justify-between sm:gap-4">
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#FF5A00]/10 text-[#FF5A00]">
          <ShoppingBag className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#000000] sm:text-base">
            Ищете что-то конкретное?
          </p>
          <p className="mt-1 text-sm text-[#4B4B4B]">
            Оставьте заявку — продавцы предложат сами.
          </p>
        </div>
      </div>
      <Link
        href={getWantToBuyHubPath()}
        className="mt-3 inline-flex shrink-0 items-center gap-1 rounded-xl bg-[#FF5A00] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#E8470F] sm:mt-0"
      >
        Перейти в раздел
        <ArrowRight className="h-4 w-4" />
      </Link>
    </section>
  )
}
