"use client"

type ActiveFilterChip = {
  key: string
  label: string
  value: string
}

type CategoryActiveFiltersProps = {
  chips: ActiveFilterChip[]
  onRemove: (key: string) => void
  onClearAll: () => void
}

export function CategoryActiveFilters({
  chips,
  onRemove,
  onClearAll,
}: CategoryActiveFiltersProps) {
  return (
    <section className="rounded-[24px] border border-zinc-200/90 bg-white px-4 py-4 shadow-[0_12px_30px_rgba(15,23,42,0.04)] sm:px-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-zinc-950">Активные фильтры</p>
          <p className="mt-1 text-xs text-zinc-500">
            {chips.length > 0
              ? `Выбрано ${chips.length} ${chips.length === 1 ? "условие" : "условий"}`
              : "Пока ничего не выбрано"}
          </p>
        </div>
        {chips.length > 0 ? (
          <button
            type="button"
            onClick={onClearAll}
            className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:border-zinc-300 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--nashlo-orange)/0.25)]"
          >
            Сбросить всё
          </button>
        ) : null}
      </div>

      {chips.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {chips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => onRemove(chip.key)}
              className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:border-zinc-300 hover:bg-white hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--nashlo-orange)/0.25)]"
            >
              <span className="truncate">
                {chip.label}: {chip.value}
              </span>
              <span aria-hidden>×</span>
            </button>
          ))}
        </div>
      ) : null}
    </section>
  )
}
