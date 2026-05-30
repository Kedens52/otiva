/** Безопасные логи OAuth на production (без секретов и state). */
export function oauthProductionLog(step: string, data?: Record<string, unknown>) {
  if (process.env.NODE_ENV !== "production" && process.env.OAUTH_DEBUG !== "1") return
  // eslint-disable-next-line no-console
  console.log(`[oauth] ${step}`, data ?? "")
}
