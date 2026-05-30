import { formatBusinessPrice, parseWholesaleTiers } from "@/lib/business/pricing"

type Props = {
  price: number
  priceFrom?: number | null
  priceTo?: number | null
  priceType?: string | null
  priceUnit?: string | null
  currency?: string
  wholesaleTiers?: unknown
  minOrderQuantity?: number | null
}

export function ListingPriceBlock({
  price,
  priceFrom,
  priceTo,
  priceType,
  priceUnit,
  currency,
  wholesaleTiers,
  minOrderQuantity,
}: Props) {
  const tiers = parseWholesaleTiers(wholesaleTiers)
  const fmt = (n: number) =>
    new Intl.NumberFormat("ru-RU", { style: "currency", currency: currency ?? "RUB", maximumFractionDigits: 0 }).format(n)

  return (
    <div className="rounded-xl border border-zinc-100 bg-zinc-50/80 p-4">
      <p className="text-2xl font-bold text-zinc-950">
        {formatBusinessPrice({ price, priceFrom, priceTo, priceType, priceUnit, currency })}
      </p>
      {minOrderQuantity != null && (
        <p className="mt-1 text-sm text-zinc-600">Мин. заказ: {minOrderQuantity}</p>
      )}
      {tiers.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-semibold uppercase text-zinc-400">Опт</p>
          <ul className="mt-1 space-y-1 text-sm text-zinc-700">
            {tiers.map((t) => (
              <li key={t.quantityFrom}>
                {t.quantityFrom}+ — {fmt(t.price)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
