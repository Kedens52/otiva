import { getRequiredCategoryAttributes } from "@/config/marketplace-categories"

function hasValue(value: unknown): boolean {
  if (typeof value === "string") return value.trim().length > 0
  if (Array.isArray(value)) return value.length > 0
  return value !== null && value !== undefined
}

export function validateCategoryAttributes(
  categorySlug: string,
  attributes: Record<string, unknown> | undefined,
): { ok: true } | { ok: false; error: string } {
  const requiredAttributes = getRequiredCategoryAttributes(categorySlug)

  if (!attributes || typeof attributes !== "object") {
    if (requiredAttributes.length === 0) return { ok: true }
    return { ok: false, error: "Заполните обязательные параметры категории." }
  }

  for (const required of requiredAttributes) {
    if (!hasValue(attributes[required.key])) {
      return { ok: false, error: `Заполните параметр: ${required.label}` }
    }
  }

  return { ok: true }
}

