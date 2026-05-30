/** Сегменты /profile/:segment — личный кабинет, не публичная страница продавца. */
const RESERVED_PROFILE_SEGMENTS = new Set([
  "settings",
  "favorites",
  "promotion",
  "finance",
  "listings",
  "notifications",
  "searches",
  "security",
  "bonuses",
  "demo",
  "want-to-buy",
  "my-offers",
  "reviews",
  "ads",
])

/** Public seller page: /profile/:id (not private cabinet sections). */
export function isPublicSellerProfilePath(pathname: string): boolean {
  const match = pathname.match(/^\/profile\/([^/]+)$/)
  if (!match) return false
  return !RESERVED_PROFILE_SEGMENTS.has(match[1])
}

/** Routes that use the seller cabinet shell (sidebar + grey background). */
export function isCabinetRoute(pathname: string): boolean {
  if (pathname === "/profile") return true
  if (pathname.startsWith("/my-listings")) return true
  if (pathname === "/chat" || pathname.startsWith("/chat/")) return true
  if (pathname.startsWith("/messages/")) return true

  if (pathname.startsWith("/profile/") && !isPublicSellerProfilePath(pathname)) {
    return true
  }

  return false
}

/** Chat list / thread routes — full-screen white on mobile. */
export function isChatAppRoute(pathname: string): boolean {
  return pathname === "/chat" || pathname.startsWith("/chat/") || pathname.startsWith("/messages/")
}
