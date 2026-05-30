import {
  MARKETPLACE_CATEGORIES,
  MARKETPLACE_CREATE_FIELDS,
  MARKETPLACE_FILTER_CONFIGS,
} from "@/config/marketplace-categories"
import { sanitizeSearchToken } from "@/lib/search/search-query"

type SearchAliasEntry = {
  tokens: string[]
  variants: string[]
}

const MANUAL_KEY_ALIASES: Record<string, string[]> = {
  carbrand: ["make", "brand"],
  carmodel: ["model"],
  servicecategory: ["services", "subcategory"],
  servicesubcategory: ["subcategory"],
  propertytype: ["property_type"],
}

function compactToken(value: string): string {
  return sanitizeSearchToken(value.toLowerCase()).replace(/[\s_-]+/g, "")
}

function tokenizeAliasText(value: string): string[] {
  const normalized = sanitizeSearchToken(value.toLowerCase())
  if (!normalized) return []

  const set = new Set<string>()
  set.add(normalized)

  for (const part of normalized.split(/[\s_-]+/)) {
    if (part.length >= 2) set.add(part)
  }

  const compact = compactToken(normalized)
  if (compact.length >= 2) set.add(compact)

  return [...set]
}

function addAliasEntry(entries: SearchAliasEntry[], texts: string[], variants: string[]) {
  const tokenSet = new Set<string>()
  const variantSet = new Set<string>()

  for (const text of texts) {
    for (const token of tokenizeAliasText(text)) {
      tokenSet.add(token)
    }
  }

  for (const variant of variants) {
    const normalized = sanitizeSearchToken(String(variant).toLowerCase())
    if (!normalized) continue
    variantSet.add(normalized)
    const compact = compactToken(normalized)
    if (compact.length >= 2) variantSet.add(compact)
  }

  if (tokenSet.size === 0 || variantSet.size === 0) return
  entries.push({ tokens: [...tokenSet], variants: [...variantSet] })
}

function buildSearchAliasEntries(): SearchAliasEntry[] {
  const entries: SearchAliasEntry[] = []

  for (const category of MARKETPLACE_CATEGORIES) {
    addAliasEntry(entries, [category.title, category.slug], [category.slug])

    for (const subcategory of category.subcategories ?? []) {
      const presetValues = Object.values(subcategory.presetAttributes ?? {}).map(String)
      addAliasEntry(
        entries,
        [subcategory.label, subcategory.slug, ...presetValues],
        [subcategory.slug, ...presetValues],
      )
    }
  }

  for (const [slug, fields] of Object.entries(MARKETPLACE_CREATE_FIELDS)) {
    addAliasEntry(entries, [slug], [slug])
    for (const field of fields) {
      addAliasEntry(entries, [field.key], [field.key])
      if (field.type === "select" || field.type === "toggle-row") {
        for (const option of field.options) {
          const normalized = typeof option === "string" ? { value: option, label: option } : option
          addAliasEntry(entries, [normalized.label, normalized.value], [normalized.value])
        }
      }
    }
  }

  for (const [slug, config] of Object.entries(MARKETPLACE_FILTER_CONFIGS)) {
    addAliasEntry(entries, [config.label, slug], [slug])
    for (const field of config.fields) {
      addAliasEntry(entries, [field.key], [field.key])
      if (field.type === "select" || field.type === "multi") {
        for (const option of field.options) {
          addAliasEntry(entries, [option.label, option.value], [option.value])
        }
      }
    }
  }

  for (const [alias, targets] of Object.entries(MANUAL_KEY_ALIASES)) {
    addAliasEntry(entries, [alias], targets)
  }

  return entries
}

const SEARCH_ALIAS_ENTRIES = buildSearchAliasEntries()

function aliasTokenMatches(queryToken: string, aliasToken: string): boolean {
  if (!queryToken || !aliasToken) return false
  if (queryToken === aliasToken) return true
  if (queryToken.length < 4 || aliasToken.length < 4) return false
  return aliasToken.includes(queryToken) || queryToken.includes(aliasToken)
}

export function expandMarketplaceSearchTokenGroups(tokenGroups: string[][]): string[][] {
  return tokenGroups.map((group) => {
    const expanded = new Set<string>(group.map((token) => sanitizeSearchToken(token.toLowerCase())))

    for (const rawToken of group) {
      const token = sanitizeSearchToken(rawToken.toLowerCase())
      if (!token) continue
      const compact = compactToken(token)

      const manualVariants = MANUAL_KEY_ALIASES[compact]
      if (manualVariants) {
        for (const variant of manualVariants) {
          expanded.add(variant.toLowerCase())
        }
      }

      for (const entry of SEARCH_ALIAS_ENTRIES) {
        if (
          entry.tokens.some((candidate) => aliasTokenMatches(token, candidate) || aliasTokenMatches(compact, candidate))
        ) {
          for (const variant of entry.variants) {
            expanded.add(variant)
          }
        }
        if (expanded.size >= 16) break
      }
    }

    return [...expanded].filter(Boolean).slice(0, 16)
  })
}
