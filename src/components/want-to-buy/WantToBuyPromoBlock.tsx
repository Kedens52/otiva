import Link from "next/link"
import { ArrowRight, Search } from "lucide-react"
import { getWantToBuyCreatePath, getWantToBuyHubPath } from "@/lib/want-to-buy/routes"

type WantToBuyPromoBlockProps = {
  compact?: boolean
  className?: string
}

export function WantToBuyPromoBlock({ compact = false, className = "" }: WantToBuyPromoBlockProps) {
  if (compact) {
    return (
      <section
        className={`rounded-[16px] border border-[rgba(15,23,42,0.06)] bg-gradient-to-r from-white to-[#FFF8F4] px-4 py-4 shadow-sm sm:flex sm:items-center sm:justify-between sm:gap-4 ${className}`}
      >
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#000000]">Не нашли нужное?</p>
          <p className="mt-1 text-sm text-[#4B4B4B]">
            Создайте заявку «Куплю» — продавцы сами предложат варианты.
          </p>
        </div>
        <div className="mt-3 flex shrink-0 flex-wrap items-center gap-2 sm:mt-0">
          <Link
            href={getWantToBuyCreatePath()}
            className="inline-flex items-center justify-center rounded-xl bg-[hsl(var(--nashlo-orange))] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[hsl(var(--nashlo-orange)/0.92)]"
          >
            Создать заявку
          </Link>
          <Link
            href={getWantToBuyHubPath()}
            className="inline-flex items-center gap-1 rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm font-semibold text-[#000000] transition hover:border-zinc-300"
          >
            Смотреть заявки
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section
      className={`rounded-[18px] border border-[rgba(15,23,42,0.06)] bg-white px-5 py-5 shadow-[0_4px_20px_rgba(15,23,42,0.04)] sm:flex sm:items-center sm:justify-between sm:gap-6 sm:px-6 sm:py-6 ${className}`}
    >
      <div className="flex min-w-0 items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[hsl(var(--nashlo-orange)/0.12)] text-[hsl(var(--nashlo-orange))]">
          <Search className="h-6 w-6" />
        </div>
        <div className="min-w-0">
          <h2 className="text-lg font-bold tracking-tight text-[#000000] sm:text-xl">
            Покупки наоборот
          </h2>
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-[#4B4B4B] sm:text-base">
            Оставьте запрос — продавцы сами предложат варианты.
          </p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2 sm:mt-0 sm:shrink-0">
        <Link
          href={getWantToBuyCreatePath()}
          className="inline-flex items-center justify-center rounded-xl bg-[hsl(var(--nashlo-orange))] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_20px_hsl(var(--nashlo-orange)/0.25)] transition hover:bg-[hsl(var(--nashlo-orange)/0.92)]"
        >
          Создать заявку
        </Link>
        <Link
          href={getWantToBuyHubPath()}
          className="inline-flex items-center gap-1 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#000000] transition hover:border-zinc-300"
        >
          Смотреть, что ищут
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  )
}
