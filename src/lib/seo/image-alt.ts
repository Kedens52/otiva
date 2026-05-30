export function buildListingImageAlt(title: string, city: string | null | undefined, index: number) {
  const cityPart = city?.trim() ? ` — ${city.trim()}` : ""
  return `${title}${cityPart}, фото ${index + 1}`
}
