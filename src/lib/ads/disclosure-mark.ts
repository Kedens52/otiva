export type AdDisclosureMark = "ad" | "partner"

export const AD_DISCLOSURE_MARK_OPTIONS: { value: AdDisclosureMark; label: string; description: string }[] = [
  { value: "ad", label: "Реклама", description: "Стандартная маркировка рекламы (ФЗ о рекламе)" },
  { value: "partner", label: "Партнёр сервиса", description: "Партнёрский материал / спонсорский контент" },
]

export const DISCLOSURE_MARK_LABEL: Record<AdDisclosureMark, string> = {
  ad: "Реклама",
  partner: "Партнёр сервиса",
}

/** Returns the human-readable label for a disclosure mark. */
export function getAdDisclosureMarkLabel(mark: AdDisclosureMark): string {
  return DISCLOSURE_MARK_LABEL[mark] ?? "Реклама"
}

/** Normalizes an unknown value to a valid AdDisclosureMark, defaulting to "ad". */
export function normalizeAdDisclosureMark(value: unknown): AdDisclosureMark {
  if (value === "partner") return "partner"
  return "ad"
}
