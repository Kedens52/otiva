import { WANT_TO_BUY_PREF_KEYS } from "@/lib/want-to-buy/notification-prefs"

export const WANT_TO_BUY_NOTIFICATION_UI_ITEMS = [
  {
    key: WANT_TO_BUY_PREF_KEYS.newOffer,
    label: "Новый отклик на заявку",
    description: "Когда продавец предлагает товар по вашей заявке «Куплю»",
  },
  {
    key: WANT_TO_BUY_PREF_KEYS.offerStatus,
    label: "Статус вашего отклика",
    description: "Когда покупатель принимает или отклоняет ваше предложение",
  },
  {
    key: WANT_TO_BUY_PREF_KEYS.expiring,
    label: "Заявка истекает",
    description: "За 3 дня до окончания срока заявки",
  },
  {
    key: WANT_TO_BUY_PREF_KEYS.rejected,
    label: "Заявка отклонена",
    description: "Если модерация отклонила заявку с комментарием",
  },
] as const
