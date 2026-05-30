export type ScoredListingRow<T> = T & {
  finalScore: number
  isPromotedListing: boolean
}

/**
 * Первая страница: не более maxPromotedRatio продвигаемых; приоритет релевантным органическим.
 */
export function applyFirstPageOrganicPromotedMix<T extends ScoredListingRow<T>>(
  sorted: T[],
  page: number,
  pageSize: number,
  maxPromotedRatio = 0.3,
): T[] {
  if (page !== 1 || sorted.length <= pageSize) return sorted

  const maxPromoted = Math.max(0, Math.floor(pageSize * maxPromotedRatio))
  const pool = [...sorted]
  const pageItems: T[] = []
  const deferred: T[] = []

  while (pageItems.length < pageSize && pool.length > 0) {
    let pickIndex = -1
    for (let i = 0; i < pool.length; i++) {
      const item = pool[i]
      const promoCount = pageItems.filter((p) => p.isPromotedListing).length
      if (item.isPromotedListing && promoCount >= maxPromoted) continue
      pickIndex = i
      break
    }
    if (pickIndex === -1) {
      pickIndex = pool.findIndex((item) => !item.isPromotedListing)
      if (pickIndex === -1) pickIndex = 0
    }
    const [picked] = pool.splice(pickIndex, 1)
    pageItems.push(picked)
  }

  return [...pageItems, ...pool, ...deferred]
}
