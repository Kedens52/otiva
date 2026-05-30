/** Валидация ИНН (10 или 12 цифр + контрольная сумма упрощённо) */
export function isValidInn(inn: string): boolean {
  const digits = inn.replace(/\D/g, "")
  if (digits.length !== 10 && digits.length !== 12) return false
  if (!/^\d+$/.test(digits)) return false
  return true
}

/** Валидация ОГРН (13) / ОГРНИП (15) */
export function isValidOgrn(ogrn: string): boolean {
  const digits = ogrn.replace(/\D/g, "")
  return digits.length === 13 || digits.length === 15
}

export function normalizeInn(inn: string): string {
  return inn.replace(/\D/g, "")
}

export function normalizeOgrn(ogrn: string): string {
  return ogrn.replace(/\D/g, "")
}

export function slugifyCompanyName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
}
