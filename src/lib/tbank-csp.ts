/**
 * Дополнительные CSP-директивы для виджета T-Bank (Speedpay).
 * Не задаём script-src — иначе заблокируются Метрика, карты и т.п.
 * @see https://developer.tbank.ru/eacq/intro/developer/setup_js/
 */
export const TBANK_CSP_DIRECTIVES = [
  "connect-src 'self' https://*.tinkoff.ru https://*.tcsbank.ru https://*.tbank.ru https://*.nspk.ru https://*.t-static.ru",
  "frame-src 'self' https://*.tinkoff.ru https://*.tcsbank.ru https://*.tbank.ru",
  "img-src 'self' data: blob: https://*.tinkoff.ru https://*.tcsbank.ru https://*.tbank.ru https://*.nspk.ru https://*.t-static.ru",
] as const

export function mergeContentSecurityPolicy(existing: string | null): string {
  const parts = existing ? [existing] : []
  parts.push(...TBANK_CSP_DIRECTIVES)
  return parts.join("; ")
}
