import Link from "next/link"
import { getWantToBuyCreatePath } from "@/lib/want-to-buy/routes"

export function WantToBuyCategoryCta({ categorySlug }: { categorySlug: string }) {
  const createHref = getWantToBuyCreatePath(categorySlug || undefined)

  return (
    <section className="rounded-[14px] border border-[rgba(15,23,42,0.06)] bg-[#FFF8F4] px-4 py-3.5 sm:flex sm:items-center sm:justify-between sm:gap-4">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-[#000000]">Не нашли нужное?</p>
        <p className="mt-0.5 text-xs text-[#4B4B4B] sm:text-sm">
          Создайте заявку «Куплю» в этой категории — продавцы сами предложат варианты.
        </p>
      </div>
      <Link
        href={createHref}
        className="mt-2 inline-flex shrink-0 items-center justify-center rounded-xl bg-[#FF5A00] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#E8470F] sm:mt-0"
      >
        Создать заявку
      </Link>
    </section>
  )
}
