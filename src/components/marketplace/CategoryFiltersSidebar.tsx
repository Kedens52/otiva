"use client"

import { ListingFilterFields, ListingPriceFields } from "@/components/marketplace/ListingFilterPanel"
import { getCategoryFilterSections, type MarketplaceFilterSection } from "@/config/marketplace-categories"
import type { FilterField, FilterState } from "@/lib/filters"

type CategoryFiltersSidebarProps = {
  category: string
  query: string
  onQueryChange: (value: string) => void
  fields: FilterField[]
  state: FilterState
  priceMin: string
  priceMax: string
  onChange: (key: string, value: string | string[]) => void
  onPriceMin: (value: string) => void
  onPriceMax: (value: string) => void
  onReset: () => void
  onRequestNearby: () => void
  onClearGeo: () => void
  geoError?: string
  nearCoords: boolean
}

function resolveSections(category: string, fields: FilterField[]) {
  const config = getCategoryFilterSections(category)
  const fieldsByKey = new Map(fields.map((field) => [field.key, field]))
  const usedKeys = new Set<string>()

  const sections = config
    .map((section) => {
      const groupedFields =
        section.keys?.map((key) => fieldsByKey.get(key)).filter((field): field is FilterField => Boolean(field)) ?? []

      for (const field of groupedFields) usedKeys.add(field.key)

      if (!section.includePrice && groupedFields.length === 0) return null
      return { ...section, fields: groupedFields }
    })
    .filter((section): section is MarketplaceFilterSection & { fields: FilterField[] } => Boolean(section))

  const leftover = fields.filter((field) => !usedKeys.has(field.key))
  if (leftover.length) {
    sections.push({
      id: "leftover",
      title: "Дополнительные фильтры",
      fields: leftover,
    })
  }

  return sections
}

export function CategoryFiltersSidebar({
  category,
  query,
  onQueryChange,
  fields,
  state,
  priceMin,
  priceMax,
  onChange,
  onPriceMin,
  onPriceMax,
  onReset,
  onRequestNearby,
  onClearGeo,
  geoError,
  nearCoords,
}: CategoryFiltersSidebarProps) {
  const sections = resolveSections(category, fields)

  return (
    <div className="space-y-3">
      <section className="rounded-[24px] border border-zinc-200/90 bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
        <p className="text-sm font-semibold text-zinc-950">Что ищем</p>
        <input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          className="mt-3 h-11 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-base outline-none transition placeholder:text-zinc-400 focus:border-[hsl(var(--nashlo-orange))] focus:bg-white focus:ring-4 focus:ring-[hsl(var(--nashlo-orange)/0.08)] lg:text-sm"
          placeholder="Название или описание"
        />
      </section>

      {sections.map((section) => (
        <section key={section.id} className="rounded-[24px] border border-zinc-200/90 bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
          <div className="mb-4">
            <p className="text-sm font-semibold text-zinc-950">{section.title}</p>
          </div>

          <div className="space-y-4">
            {section.includePrice ? (
              <ListingPriceFields
                priceMin={priceMin}
                priceMax={priceMax}
                onPriceMin={onPriceMin}
                onPriceMax={onPriceMax}
              />
            ) : null}

            {section.fields.length ? (
              <ListingFilterFields
                fields={section.fields}
                state={state}
                onChange={onChange}
              />
            ) : null}

            {section.showGeoActions ? (
              <div className="space-y-3">
                <div className="grid gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={onRequestNearby}
                    className="rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm font-semibold text-zinc-700 transition hover:border-zinc-300 hover:bg-white hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--nashlo-orange)/0.25)]"
                  >
                    Рядом со мной
                  </button>
                  <button
                    type="button"
                    onClick={onClearGeo}
                    className="rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm font-semibold text-zinc-700 transition hover:border-zinc-300 hover:bg-white hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--nashlo-orange)/0.25)]"
                  >
                    Сбросить геопоиск
                  </button>
                </div>
                <p className={`text-xs leading-5 ${geoError ? "text-amber-700" : "text-zinc-500"}`}>
                  {geoError ||
                    (nearCoords
                      ? "Геопоиск включен. Радиус поиска доступен."
                      : "Радиус поиска пока недоступен: В разработке до появления координат.")}
                </p>
              </div>
            ) : null}
          </div>
        </section>
      ))}

      <button
        type="button"
        onClick={onReset}
        className="w-full rounded-2xl border border-zinc-200 bg-white py-3 text-sm font-semibold text-zinc-700 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--nashlo-orange)/0.25)]"
      >
        Сбросить фильтры
      </button>
    </div>
  )
}
