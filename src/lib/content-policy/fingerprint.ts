import { createHash } from "crypto"

/** Нормализация текста для сравнения дублей. */
export function normalizeTextForFingerprint(text: string): string {
  return text
    .toLowerCase()
    .replace(/https?:\/\/\S+/gi, " ")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
}

export function buildContentFingerprint(title: string, description: string): string {
  const normalized = normalizeTextForFingerprint(`${title}\n${description}`)
  return createHash("sha256").update(normalized).digest("hex")
}
