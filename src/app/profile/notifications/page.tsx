"use client"

import { useEffect, useState } from "react"
import { WANT_TO_BUY_NOTIFICATION_UI_ITEMS } from "@/lib/want-to-buy/notification-ui-items"

type NotificationSettings = {
  newMessage: boolean
  listingApproved: boolean
  listingRejected: boolean
  newReview: boolean
  promotionExpiring: boolean
  wantToBuyNewOffer: boolean
  wantToBuyOfferStatus: boolean
  wantToBuyExpiring: boolean
  wantToBuyRejected: boolean
}

const ITEMS: { key: keyof NotificationSettings; label: string; description: string; icon: string }[] = [
  {
    key: "newMessage",
    label: "Новые сообщения",
    description: "Уведомление при получении нового сообщения в чате",
    icon: "&#128172;",
  },
  {
    key: "listingApproved",
    label: "Объявление одобрено",
    description: "Когда модератор одобряет ваше объявление",
    icon: "&#9989;",
  },
  {
    key: "listingRejected",
    label: "Объявление отклонено",
    description: "Когда модератор отклоняет объявление с причиной",
    icon: "&#10060;",
  },
  {
    key: "newReview",
    label: "Новый отзыв",
    description: "Когда покупатель оставляет отзыв о вас",
    icon: "&#11088;",
  },
  {
    key: "promotionExpiring",
    label: "Продвижение заканчивается",
    description: "За 3 дня до окончания платного продвижения",
    icon: "&#128276;",
  },
  ...WANT_TO_BUY_NOTIFICATION_UI_ITEMS.map((item) => ({
    key: item.key as keyof NotificationSettings,
    label: item.label,
    description: item.description,
    icon: "&#128722;",
  })),
]

export default function ProfileNotificationsPage() {
  const [settings, setSettings] = useState<NotificationSettings>({
    newMessage: true,
    listingApproved: true,
    listingRejected: true,
    newReview: true,
    promotionExpiring: true,
    wantToBuyNewOffer: true,
    wantToBuyOfferStatus: true,
    wantToBuyExpiring: true,
    wantToBuyRejected: true,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((d) => {
        const ns = d.user?.notificationSettings ?? d.notificationSettings
        if (ns) setSettings({ ...settings, ...ns })
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const toggle = (key: keyof NotificationSettings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }))
    setSaved(false)
  }

  const save = async () => {
    setSaving(true)
    await fetch("/api/profile/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  if (loading) {
    return (
      <div>
        <h1 className="text-xl font-bold text-gray-900 mb-4">Уведомления</h1>
        <div className="bg-white rounded-xl shadow-sm p-4 space-y-4 animate-pulse">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-200 rounded-lg" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 bg-gray-200 rounded w-1/3" />
                <div className="h-3 bg-gray-200 rounded w-2/3" />
              </div>
              <div className="w-10 h-6 bg-gray-200 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-1">Уведомления</h1>
      <p className="text-sm text-gray-500 mb-5">Выберите, о чём вы хотите получать уведомления</p>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-4">
        {ITEMS.map((item, idx) => (
          <div
            key={item.key}
            className={`flex items-start gap-3 px-4 py-3.5 ${idx !== ITEMS.length - 1 ? "border-b border-gray-50" : ""}`}
          >
            <div className="w-9 h-9 bg-orange-50 rounded-lg flex items-center justify-center text-lg shrink-0">
              <span dangerouslySetInnerHTML={{ __html: item.icon }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">{item.label}</p>
              <p className="text-xs text-gray-500 mt-0.5 leading-snug">{item.description}</p>
            </div>
            <button
              onClick={() => toggle(item.key)}
              className={`relative mt-1 inline-flex h-6 w-10 shrink-0 items-center rounded-full transition-colors ${
                settings[item.key] ? "bg-orange-500" : "bg-gray-200"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                  settings[item.key] ? "translate-x-5" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={save}
        disabled={saving || saved}
        className={`w-full py-3 rounded-xl font-medium text-sm transition-colors ${
          saved
            ? "bg-green-500 text-white"
            : "bg-orange-500 hover:bg-orange-600 text-white"
        } disabled:opacity-60`}
      >
        {saved ? "&#10003; Сохранено" : saving ? "Сохраняем..." : "Сохранить настройки"}
      </button>
    </div>
  )
}
