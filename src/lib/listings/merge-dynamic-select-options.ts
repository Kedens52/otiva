import type { FilterField, FilterOption } from "@/lib/filters"

/** Дополняет select-поля значениями из API (`availableFilterOptions`), без дублей по value. */
export function fieldsWithDynamicSelectOptions(
  fields: FilterField[],
  dynamic: Record<string, string[] | undefined>,
): FilterField[] {
  return fields.map((field) => {
    if (field.type !== "select") return field
    const dyn = dynamic[field.key]
    if (!dyn?.length) return field
    const seen = new Set(field.options.map((o) => o.value))
    const extra: FilterOption[] = dyn
      .filter((v) => v && !seen.has(v))
      .sort((a, b) => a.localeCompare(b, "ru"))
      .map((v) => ({ value: v, label: v }))
    if (extra.length === 0) return field
    return { ...field, options: [...field.options, ...extra] }
  })
}
