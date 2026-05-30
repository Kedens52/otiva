/** Минимальные критерии «качественного» объявления для бонусов. */
export function isQualityListing(input: {
  title?: string | null
  description?: string | null
  images?: string[] | null
  status?: string
}): boolean {
  if (input.status && input.status !== "ACTIVE") return false
  const title = (input.title ?? "").trim()
  const desc = (input.description ?? "").trim()
  const images = input.images ?? []
  return title.length >= 8 && desc.length >= 50 && images.length >= 3
}
