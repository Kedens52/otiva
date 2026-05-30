"use client"

import type { FilterField, FilterState } from "@/lib/filters"

const filterControlClass =
  "min-w-0 h-11 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 text-base leading-snug text-zinc-900 outline-none transition placeholder:text-zinc-400 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-400 focus:border-[hsl(var(--nashlo-orange))] focus:bg-white focus:ring-4 focus:ring-[hsl(var(--nashlo-orange)/0.08)] lg:text-sm"

type ListingFilterPanelProps = {
  fields: FilterField[]
  state: FilterState
  priceMin: string
  priceMax: string
  onChange: (key: string, value: string | string[]) => void
  onPriceMin: (value: string) => void
  onPriceMax: (value: string) => void
  onReset: () => void
}

type ListingFilterFieldsProps = Pick<ListingFilterPanelProps, "fields" | "state" | "onChange">

type ListingPriceFieldsProps = Pick<
  ListingFilterPanelProps,
  "priceMin" | "priceMax" | "onPriceMin" | "onPriceMax"
>

export function ListingPriceFields({
  priceMin,
  priceMax,
  onPriceMin,
  onPriceMax,
}: ListingPriceFieldsProps) {
  return (
    <div className="min-w-0">
      <p className="mb-2 text-sm font-semibold text-zinc-950">Цена, ₽</p>
      <div className="grid min-w-0 grid-cols-2 gap-2">
        <input
          type="number"
          inputMode="decimal"
          placeholder="от"
          value={priceMin}
          onChange={(e) => onPriceMin(e.target.value)}
          className={`min-w-0 flex-1 ${filterControlClass}`}
        />
        <input
          type="number"
          inputMode="decimal"
          placeholder="до"
          value={priceMax}
          onChange={(e) => onPriceMax(e.target.value)}
          className={`min-w-0 flex-1 ${filterControlClass}`}
        />
      </div>
    </div>
  )
}

export function ListingFilterFields({ fields, state, onChange }: ListingFilterFieldsProps) {
  return (
    <>
      {fields.map((field) => {
        if (field.type === "select") {
          return (
            <div key={field.key} className="min-w-0 max-w-full">
              <p className="mb-2 text-sm font-semibold text-zinc-950">{field.label}</p>
              <select
                value={(state[field.key] as string) || ""}
                onChange={(e) => onChange(field.key, e.target.value)}
                disabled={field.disabled}
                className={filterControlClass}
              >
                {!field.options.some((option) => option.value === "") ? (
                  <option value="">Все</option>
                ) : null}
                {field.options.map((option) => (
                  <option
                    key={option.value === "" ? "__all" : option.value}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                ))}
              </select>
              {field.helperText ? (
                <p className="mt-1 text-xs leading-5 text-zinc-400">{field.helperText}</p>
              ) : null}
            </div>
          )
        }

        if (field.type === "range") {
          return (
            <div key={field.key} className="min-w-0">
              <p className="mb-2 text-sm font-semibold text-zinc-950">
                {field.label}
                {field.unit ? `, ${field.unit}` : ""}
              </p>
              <div className="grid min-w-0 grid-cols-2 gap-2">
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="от"
                  value={(state[field.key + "_from"] as string) || ""}
                  disabled={field.disabled}
                  onChange={(e) => onChange(field.key + "_from", e.target.value)}
                  className={`min-w-0 flex-1 ${filterControlClass}`}
                />
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="до"
                  value={(state[field.key + "_to"] as string) || ""}
                  disabled={field.disabled}
                  onChange={(e) => onChange(field.key + "_to", e.target.value)}
                  className={`min-w-0 flex-1 ${filterControlClass}`}
                />
              </div>
              {field.helperText ? (
                <p className="mt-1 text-xs leading-5 text-zinc-400">{field.helperText}</p>
              ) : null}
            </div>
          )
        }

        if (field.type === "multi") {
          const selected = (state[field.key] as string[]) || []
          return (
            <div key={field.key} className="min-w-0">
              <p className="mb-2 text-sm font-semibold text-zinc-950">{field.label}</p>
              <div className="flex flex-wrap gap-2">
                {field.options.map((option) => {
                  const active = selected.includes(option.value)
                  return (
                    <button
                      key={option.value}
                      type="button"
                      disabled={field.disabled}
                      onClick={() =>
                        onChange(
                          field.key,
                          active
                            ? selected.filter((value) => value !== option.value)
                            : [...selected, option.value],
                        )
                      }
                      className={`max-w-full break-words rounded-2xl border px-3.5 py-2 text-left text-xs font-semibold leading-snug transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--nashlo-orange)/0.25)] disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm ${
                        active
                           ? "border-[hsl(var(--nashlo-orange))] bg-[hsl(var(--nashlo-orange))] text-white shadow-sm"
                          : "border-zinc-200 bg-zinc-50 text-zinc-600 hover:border-zinc-300 hover:bg-white hover:shadow-sm"
                      }`}
                    >
                      {option.label}
                    </button>
                  )
                })}
              </div>
              {field.helperText ? (
                <p className="mt-1 text-xs leading-5 text-zinc-400">{field.helperText}</p>
              ) : null}
            </div>
          )
        }

        if (field.type === "toggle") {
          const active = state[field.key] === "1"
          return (
            <label key={field.key} className="flex min-w-0 cursor-pointer items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-3.5 py-3 transition hover:bg-white">
              <span className="min-w-0 flex-1 text-sm font-medium leading-snug text-zinc-700">
                {field.label}
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={active}
                disabled={field.disabled}
                onClick={() => onChange(field.key, active ? "" : "1")}
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                  active ? "bg-[hsl(var(--nashlo-orange))]" : "bg-zinc-300"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                    active ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </button>
            </label>
          )
        }

        if (field.type === "text") {
          return (
            <div key={field.key} className="min-w-0">
              <p className="mb-2 text-sm font-semibold text-zinc-950">{field.label}</p>
              <input
                type="text"
                placeholder={field.placeholder}
                value={(state[field.key] as string) || ""}
                disabled={field.disabled}
                onChange={(e) => onChange(field.key, e.target.value)}
                className={filterControlClass}
              />
              {field.helperText ? (
                <p className="mt-1 text-xs leading-5 text-zinc-400">{field.helperText}</p>
              ) : null}
            </div>
          )
        }

        return null
      })}
    </>
  )
}

export function ListingFilterPanel({
  fields,
  state,
  priceMin,
  priceMax,
  onChange,
  onPriceMin,
  onPriceMax,
  onReset,
}: ListingFilterPanelProps) {
  return (
    <div className="min-w-0 space-y-5">
      <ListingPriceFields
        priceMin={priceMin}
        priceMax={priceMax}
        onPriceMin={onPriceMin}
        onPriceMax={onPriceMax}
      />
      <ListingFilterFields fields={fields} state={state} onChange={onChange} />
      <button
        type="button"
        onClick={onReset}
        className="w-full rounded-2xl border border-zinc-200 py-3 text-base font-medium text-zinc-500 transition hover:bg-zinc-50 hover:text-zinc-950 lg:text-sm"
      >
        Сбросить фильтры
      </button>
    </div>
  )
}
