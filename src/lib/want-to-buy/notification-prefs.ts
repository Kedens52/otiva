/** Ключи в User.notificationSettings (JSON). */
export const WANT_TO_BUY_PREF_KEYS = {
  newOffer: "wantToBuyNewOffer",
  offerStatus: "wantToBuyOfferStatus",
  expiring: "wantToBuyExpiring",
  rejected: "wantToBuyRejected",
} as const

export type WantToBuyPrefKey = keyof typeof WANT_TO_BUY_PREF_KEYS

export type WantToBuyNotificationSettings = {
  wantToBuyNewOffer?: boolean
  wantToBuyOfferStatus?: boolean
  wantToBuyExpiring?: boolean
  wantToBuyRejected?: boolean
}

export function wantsWantToBuyNotification(
  settings: unknown,
  key: WantToBuyPrefKey,
): boolean {
  const field = WANT_TO_BUY_PREF_KEYS[key]
  if (settings == null || typeof settings !== "object") return true
  const prefs = settings as WantToBuyNotificationSettings
  const value = prefs[field as keyof WantToBuyNotificationSettings]
  return value !== false
}
