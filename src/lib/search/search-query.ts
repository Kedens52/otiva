/**
 * Разбор поисковой строки для объявлений: токены, нормализация, защита от «ломающих» LIKE символов.
 */

const STOPWORDS = new Set([
  "и", "в", "во", "на", "по", "для", "из", "к", "у", "о", "об", "от", "до", "the", "a", "an",
])

const TOKEN_VARIANTS: Record<string, string[]> = {
  ванная: ["ванная", "ванной", "ванну", "санузел", "санузлов", "сантехника", "плитка"],
  ванной: ["ванная", "ванной", "ванну", "санузел", "санузлов", "сантехника", "плитка"],
  ванну: ["ванная", "ванной", "ванну", "санузел", "санузлов", "сантехника", "плитка"],
  санузел: ["санузел", "санузлов", "ванная", "сантехника"],
  санузлов: ["санузел", "санузлов", "ванная", "сантехника"],
  сантехника: ["сантехника", "санузел", "ванная", "плитка"],
  плитка: ["плитка", "ванная", "санузел", "сантехника"],
  ремонт: ["ремонт", "отделка", "мастер"],
}

/** Удаляем символы, которые в ILIKE трактуются как wildcard или ломают шаблон. */
export function sanitizeSearchToken(raw: string): string {
  return raw
    .replace(/[%_\\]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

export function tokenizeSearchQuery(q: string | null | undefined): string[] {
  if (!q) return []
  const lower = q.trim().toLowerCase()
  if (!lower) return []
  const parts = lower.split(/[\s,.;:!?/|()[\]{}<>«»"'+]+/).map(sanitizeSearchToken)
  const out: string[] = []
  for (const p of parts) {
    if (p.length < 2) continue
    if (STOPWORDS.has(p)) continue
    out.push(p)
    if (out.length >= 14) break
  }
  return out
}

export function tokenizeSearchQueryGroups(q: string | null | undefined): string[][] {
  const tokens = tokenizeSearchQuery(q)
  return tokens.map((token) => {
    const variants = TOKEN_VARIANTS[token] ?? [token]
    const unique = new Set<string>()
    for (const variant of variants) {
      const clean = sanitizeSearchToken(variant.toLowerCase())
      if (clean.length >= 2 && !STOPWORDS.has(clean)) unique.add(clean)
    }
    unique.add(token)
    return Array.from(unique)
  })
}

export function ilikePattern(token: string): string {
  return `%${sanitizeSearchToken(token)}%`
}
