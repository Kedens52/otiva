/**
 * Единая точка конфигурации фильтров по категориям для UI и документации API.
 * Сами определения полей — в `@/lib/filters` (без дублирования списков options).
 */
import type { FilterField } from "@/lib/filters"
import {
  CATEGORY_FILTERS,
  GENERAL_FILTERS,
  DATE_RANGE_FILTER_FIELD,
  filterFieldsForCategory,
  labelForFilterField,
  LISTING_SLUGS,
  LISTING_CATEGORY_SLUGS,
  getAllowedListingSearchParamKeys,
  sanitizeListingSearchParams,
  normalizeListingsSearchParams,
  expandFilterFieldsToUrlKeys,
} from "@/lib/filters"

export {
  CATEGORY_FILTERS,
  GENERAL_FILTERS,
  DATE_RANGE_FILTER_FIELD,
  filterFieldsForCategory,
  labelForFilterField,
  LISTING_SLUGS,
  LISTING_CATEGORY_SLUGS,
  getAllowedListingSearchParamKeys,
  sanitizeListingSearchParams,
  normalizeListingsSearchParams,
  expandFilterFieldsToUrlKeys,
}

export type { FilterField }

/** Псевдонимы query → внутренние ключи (дублирует логику normalizeListingsSearchParams для документации). */
export const LISTINGS_QUERY_ALIASES: Record<string, string> = {
  carBrand: "make",
  carModel: "model",
  hasPhoto: "with_photos",
  productBrand: "brand",
  limit: "pageSize",
  sort: "sortBy",
  query: "q",
}

/** Ключи GET /api/listings → `availableFilterOptions` (динамика с учётом остальных фильтров). */
export const AVAILABLE_FILTER_OPTION_KEYS = ["cities", "subcategories", "makes", "models"] as const
