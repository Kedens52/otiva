/** Публичное название раздела заявок покупателей (UI, SEO, навигация). */
export const WANT_TO_BUY_SECTION_LABEL = "Куплю"

/** Публичный URL раздела (транслит «куплю»). */
export const WANT_TO_BUY_PUBLIC_BASE = "/kyplu"

export function isWantToBuyPublicPath(pathname: string): boolean {
  return pathname === WANT_TO_BUY_PUBLIC_BASE || pathname.startsWith(`${WANT_TO_BUY_PUBLIC_BASE}/`)
}
