/**
 * Только development: без секретов и персональных данных.
 */
export function oauthDebug(step: string, data?: Record<string, unknown>) {
  if (process.env.NODE_ENV !== "development") return
  // eslint-disable-next-line no-console
  console.log(`[oauth-debug] ${step}`, data ?? "")
}
