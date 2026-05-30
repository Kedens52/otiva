import type { SeoCategoryPageState } from "@/lib/seo/collections"

export function buildCategorySeoFooterText(
  state: SeoCategoryPageState,
  listingCount: number,
  popularFilters: string[] = [],
) {
  const scope = state.scopeLabel ? `«${state.scopeLabel}»` : `«${state.config.label}»`
  const cityPart = state.initialCity ? ` в городе ${state.initialCity}` : ""
  const filters =
    popularFilters.length > 0
      ? ` Популярные фильтры: ${popularFilters.slice(0, 5).join(", ")}.`
      : ""

  if (listingCount < 5) {
    return (
      `На Nashlo можно найти объявления в разделе ${scope}${cityPart}. ` +
      `В этом разделе пока немного объявлений, но он регулярно обновляется. ` +
      `Вы можете сохранить поиск или разместить своё объявление бесплатно.${filters}`
    )
  }

  return (
    `На Nashlo можно найти объявления в разделе ${scope}${cityPart}. ` +
    `Сейчас в подборке ${listingCount.toLocaleString("ru-RU")} активных предложений.${filters} ` +
    `Используйте фильтры по цене, району и параметрам, чтобы быстрее выбрать подходящее предложение. ` +
    `Размещайте объявления, сравнивайте варианты и связывайтесь с продавцами напрямую.`
  )
}
