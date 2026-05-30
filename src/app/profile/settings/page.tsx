"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { formatJoinedYear, profileTypeLabel, resolveProfileLevelDisplay } from "@/lib/profile-hub"
import type { UserIdentityMeta } from "@/lib/user-identity"
import { ProfileBadgesSection } from "@/components/profile/ProfileBadgesSection"
import {
  ProfileDataSections,
  type ProfileSettingsForm,
} from "@/components/profile/settings/ProfileDataSections"
import type { MarketplaceCompleteness } from "@/lib/profile/completeness-marketplace"
import { validateProfileForm } from "@/lib/profile/validation"
import type { PublicUserBadge } from "@/lib/badges/badge-map"
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

type SessionRow = {
  id: string
  device: string | null
  ip: string | null
  lastActiveAt: string
  current?: boolean
}

const NOTIFICATION_ITEMS: {
  key: keyof NotificationSettings
  label: string
  description: string
}[] = [
  { key: "newMessage", label: "Новые сообщения", description: "Когда пишут в чат по объявлению" },
  { key: "listingApproved", label: "Объявление одобрено", description: "После успешной модерации" },
  { key: "listingRejected", label: "Объявление отклонено", description: "С причиной от модератора" },
  { key: "newReview", label: "Новый отзыв", description: "Оценка от покупателя" },
  { key: "promotionExpiring", label: "Продвижение заканчивается", description: "За 3 дня до окончания услуги" },
  ...WANT_TO_BUY_NOTIFICATION_UI_ITEMS.map((item) => ({
    key: item.key as keyof NotificationSettings,
    label: item.label,
    description: item.description,
  })),
]

const defaultNotifications: NotificationSettings = {
  newMessage: true,
  listingApproved: true,
  listingRejected: true,
  newReview: true,
  promotionExpiring: true,
  wantToBuyNewOffer: true,
  wantToBuyOfferStatus: true,
  wantToBuyExpiring: true,
  wantToBuyRejected: true,
}

function sessionLabel(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60) return "только что"
  if (diff < 3600) return `${Math.floor(diff / 60)} мин. назад`
  if (diff < 86400) return `${Math.floor(diff / 3600)} ч. назад`
  return new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })
}

export default function ProfileSettingsPage() {
  const router = useRouter()
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState<ProfileSettingsForm | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [completeness, setCompleteness] = useState<MarketplaceCompleteness | null>(null)
  const [identity, setIdentity] = useState<UserIdentityMeta | null>(null)
  const [notifications, setNotifications] = useState<NotificationSettings>(defaultNotifications)
  const [sessions, setSessions] = useState<SessionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingNotifications, setSavingNotifications] = useState(false)
  const [profileSuccess, setProfileSuccess] = useState(false)
  const [notificationsSuccess, setNotificationsSuccess] = useState(false)
  const [error, setError] = useState("")
  const [uploading, setUploading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState("")
  const [deleting, setDeleting] = useState(false)
  const [myBadges, setMyBadges] = useState<PublicUserBadge[]>([])

  useEffect(() => {
    Promise.all([
      fetch("/api/profile").then((r) => (r.ok ? r.json() : null)),
      fetch("/api/profile/sessions").then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([profileData, sessionsData]) => {
        if (!profileData?.user) {
          router.push("/login?from=/profile/settings")
          return
        }
        const user = profileData.user
        setForm({
          id: user.id,
          name: user.name || "",
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          phone: user.phone || "",
          email: user.email || "",
          city: user.city || "",
          region: user.region || "",
          district: user.district || "",
          metro: user.metro || "",
          addressNote: user.addressNote || "",
          description: user.description || "",
          profileHeadline: user.profileHeadline || "",
          avatar: user.avatar || "",
          profileType: user.profileType === "COMPANY" ? "COMPANY" : "PERSON",
          sellerRole: user.sellerRole || "",
          companyName: user.companyName || "",
          companyInn: user.companyInn || "",
          companyWebsite: user.companyWebsite || "",
          companyRole: user.companyRole || "",
          businessCategory: user.businessCategory || "",
          experience: user.experience || "",
          serviceArea: user.serviceArea || "",
          deliveryOptions: Array.isArray(user.deliveryOptions) ? user.deliveryOptions : [],
          guaranteeText: user.guaranteeText || "",
          websiteUrl: user.websiteUrl || "",
          vkUrl: user.vkUrl || "",
          maxUrl: user.maxUrl || "",
          createdAt: user.createdAt,
          trustTier: user.trustTier || "NORMAL",
          isVerified: Boolean(user.isVerified),
          showPhone: Boolean(user.showPhone),
          showPhonePublicly: Boolean(user.showPhonePublicly),
          showEmailPublicly: Boolean(user.showEmailPublicly),
          showCityPublicly: user.showCityPublicly !== false,
          showDistrictPublicly: user.showDistrictPublicly !== false,
          showActivityPublicly: user.showActivityPublicly !== false,
          showBadgesPublicly: user.showBadgesPublicly !== false,
          showReviewsPublicly: user.showReviewsPublicly !== false,
        })
        setCompleteness(user.profileCompleteness ?? null)
        setIdentity(user.identity ?? null)
        const ns = user.notificationSettings
        if (ns && typeof ns === "object") {
          setNotifications({ ...defaultNotifications, ...ns })
        }
        setSessions(sessionsData?.sessions ?? [])
        setMyBadges(Array.isArray(user.badges) ? user.badges : [])
      })
      .catch(() => router.push("/login?from=/profile/settings"))
      .finally(() => setLoading(false))
  }, [router])

  async function uploadAvatar(file: File) {
    if (file.size > 5 * 1024 * 1024) {
      setError("Файл слишком большой. Максимум 5 МБ.")
      return
    }
    setUploading(true)
    setError("")
    const formData = new FormData()
    formData.append("file", file)
    formData.append("type", "image")
    try {
      const response = await fetch("/api/upload", { method: "POST", body: formData })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Не удалось загрузить фото")
      setForm((current) => (current ? { ...current, avatar: data.url } : current))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось загрузить фото")
    } finally {
      setUploading(false)
    }
  }

  async function saveProfile() {
    if (!form) return
    const clientErrors = validateProfileForm({
      name: form.name,
      firstName: form.firstName,
      lastName: form.lastName,
      profileHeadline: form.profileHeadline,
      description: form.description,
      region: form.region,
      city: form.city,
      district: form.district,
      metro: form.metro,
      addressNote: form.addressNote,
      profileType: form.profileType,
      sellerRole: form.sellerRole,
      companyName: form.companyName,
      businessCategory: form.businessCategory,
      companyInn: form.companyInn,
      companyWebsite: form.companyWebsite,
      companyRole: form.companyRole,
      guaranteeText: form.guaranteeText,
      vkUrl: form.vkUrl,
      maxUrl: form.maxUrl,
      websiteUrl: form.websiteUrl,
    })
    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors)
      setError("Исправьте ошибки в форме")
      return
    }
    setSavingProfile(true)
    setError("")
    setFieldErrors({})
    setProfileSuccess(false)
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          firstName: form.firstName,
          lastName: form.lastName,
          profileHeadline: form.profileHeadline,
          city: form.city,
          region: form.region,
          district: form.district,
          metro: form.metro,
          addressNote: form.addressNote,
          description: form.description,
          avatar: form.avatar,
          profileType: form.profileType,
          sellerRole: form.profileType === "PERSON" ? form.sellerRole : "",
          companyName: form.companyName,
          companyInn: form.companyInn,
          companyWebsite: form.companyWebsite,
          companyRole: form.companyRole,
          businessCategory: form.businessCategory,
          experience: form.experience,
          serviceArea: form.serviceArea,
          deliveryOptions: form.deliveryOptions,
          guaranteeText: form.guaranteeText,
          websiteUrl: form.websiteUrl,
          vkUrl: form.vkUrl,
          maxUrl: form.maxUrl,
          showPhone: form.showPhone,
          showPhonePublicly: form.showPhonePublicly,
          showEmailPublicly: form.showEmailPublicly,
          showCityPublicly: form.showCityPublicly,
          showDistrictPublicly: form.showDistrictPublicly,
          showActivityPublicly: form.showActivityPublicly,
          showBadgesPublicly: form.showBadgesPublicly,
          showReviewsPublicly: form.showReviewsPublicly,
        }),
      })
      const data = await response.json()
      if (!response.ok) {
        if (data.fieldErrors) {
          const flat: Record<string, string> = {}
          for (const [k, v] of Object.entries(data.fieldErrors)) {
            if (Array.isArray(v) && v[0]) flat[k] = String(v[0])
          }
          setFieldErrors(flat)
        }
        throw new Error(data.error || "Не удалось сохранить профиль")
      }
      if (data.user) {
        setIdentity(data.user.identity ?? identity)
        setCompleteness(data.user.profileCompleteness ?? completeness)
      }
      setProfileSuccess(true)
      window.dispatchEvent(new Event("nashlo-auth-change"))
      setTimeout(() => setProfileSuccess(false), 2500)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось сохранить профиль")
    } finally {
      setSavingProfile(false)
    }
  }

  async function saveNotifications() {
    setSavingNotifications(true)
    setNotificationsSuccess(false)
    try {
      const response = await fetch("/api/profile/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(notifications),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Не удалось сохранить")
      setNotificationsSuccess(true)
      setTimeout(() => setNotificationsSuccess(false), 2500)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось сохранить уведомления")
    } finally {
      setSavingNotifications(false)
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" })
    window.dispatchEvent(new Event("nashlo-auth-change"))
    router.push("/")
  }

  async function deleteAccount() {
    if (deleteConfirm !== "УДАЛИТЬ") {
      setError('Введите слово «УДАЛИТЬ» для подтверждения')
      return
    }
    setDeleting(true)
    setError("")
    try {
      const response = await fetch("/api/profile", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: "УДАЛИТЬ" }),
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Не удалось удалить аккаунт")
      }
      window.dispatchEvent(new Event("nashlo-auth-change"))
      router.push("/")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось удалить аккаунт")
    } finally {
      setDeleting(false)
    }
  }

  function copyUserId() {
    if (!form) return
    void navigator.clipboard.writeText(form.id)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading || !form) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-[hsl(var(--nashlo-orange))]" />
      </div>
    )
  }

  const displayName = form.name || [form.firstName, form.lastName].filter(Boolean).join(" ") || "Профиль"
  const initials = displayName[0]?.toUpperCase() || "П"
  const level = resolveProfileLevelDisplay(form.trustTier, myBadges)
  const progress = completeness?.score ?? 0
  const settingsReturn = encodeURIComponent("/profile/settings")

  return (
    <div className="w-full min-w-0 pb-10">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-zinc-950 sm:text-[22px]">Настройки профиля</h1>
        <p className="mt-1 text-sm text-zinc-500">Имя, тип аккаунта, вход, уведомления и безопасность — в одном месте.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="space-y-4 lg:sticky lg:top-24 lg:h-fit">
          <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                {form.avatar ? (
                  <img src={form.avatar} alt="" className="h-20 w-20 rounded-2xl object-cover" />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[hsl(var(--nashlo-orange))] text-2xl font-bold text-white">
                    {initials}
                  </div>
                )}
                {uploading && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/45">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate font-bold text-zinc-950">{displayName}</p>
                <p className="mt-0.5 text-sm text-zinc-500">{profileTypeLabel(form.profileType)}</p>
                <p className="text-xs text-zinc-400">На Нашло с {formatJoinedYear(form.createdAt)}</p>
              </div>
            </div>

            <ProfileBadgesSection badges={myBadges} showEmpty className="mt-4 rounded-2xl bg-zinc-50 p-3" />

            <div className="mt-4 rounded-2xl bg-zinc-50 p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-zinc-700">Заполнение</span>
                <span className="font-bold text-[hsl(var(--nashlo-orange))]">{progress}%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
                <div className="h-full rounded-full bg-[hsl(var(--nashlo-orange))]" style={{ width: `${progress}%` }} />
              </div>
            </div>

            <div className="mt-3 grid gap-2">
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={uploading}
                className="rounded-xl bg-[hsl(var(--nashlo-orange))] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {uploading ? "Загружаем…" : "Сменить фото"}
              </button>
              {form.avatar && (
                <button
                  type="button"
                  onClick={() => setForm((c) => (c ? { ...c, avatar: "" } : c))}
                  className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-600 hover:bg-zinc-50"
                >
                  Удалить фото
                </button>
              )}
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) uploadAvatar(file)
                  e.target.value = ""
                }}
              />
            </div>
          </section>

          {identity && (
            <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
              <h2 className="text-base font-semibold text-zinc-950">Ваш аккаунт</h2>
              <p className="mt-1 text-sm text-zinc-500">Номер для поддержки и публичной страницы.</p>
              <p className="mt-3 text-2xl font-bold tracking-tight text-zinc-950">№ {identity.publicNumber}</p>
              <p className="mt-1 text-xs text-zinc-400">
                Уровень: {level.title} · {form.isVerified ? "проверен" : "без проверки"}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  href={`/profile/${form.id}`}
                  className="rounded-xl border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
                >
                  Публичный профиль
                </Link>
                <button
                  type="button"
                  onClick={copyUserId}
                  className="rounded-xl border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
                >
                  {copied ? "Скопировано" : "ID для поддержки"}
                </button>
              </div>
            </section>
          )}
        </aside>

        <div className="space-y-5">
          <ProfileDataSections
            form={form}
            setForm={setForm}
            fieldErrors={fieldErrors}
            completeness={completeness}
            saving={savingProfile}
            profileSuccess={profileSuccess}
            onSave={saveProfile}
          />

          <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm sm:p-7">
            <h2 className="text-xl font-semibold text-zinc-950">Вход и уникальность</h2>
            <p className="mt-1 text-sm leading-6 text-zinc-500">
              Телефон, почта, VK и Яндекс привязываются к одному аккаунту. При совпадении контактов система объединяет записи, чтобы не было дублей.
            </p>
            {identity && (
              <p className="mt-2 rounded-2xl bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
                Основной ключ: <span className="font-semibold text-zinc-900">{identity.uniqueKeyLabel}</span>
                <span className="block truncate text-xs text-zinc-400 mt-1">{identity.uniqueKey}</span>
              </p>
            )}
            <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-zinc-100 bg-zinc-50/80 px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-zinc-900">Показывать номер в объявлениях</p>
                <p className="text-xs text-zinc-500">
                  Покупатели увидят маску и смогут раскрыть номер по кнопке. Без галочки — только чат.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={form.showPhone}
                disabled={!form.phone || savingProfile}
                onClick={() => setForm((c) => (c ? { ...c, showPhone: !c.showPhone } : c))}
                className={
                  "relative h-7 w-12 shrink-0 rounded-full transition " +
                  (form.showPhone ? "bg-[hsl(var(--nashlo-orange))]" : "bg-zinc-300") +
                  (!form.phone ? " opacity-40" : "")
                }
              >
                <span
                  className={
                    "absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition " +
                    (form.showPhone ? "left-[22px]" : "left-0.5")
                  }
                />
              </button>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <div className="rounded-2xl bg-zinc-50 px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">Телефон</p>
                <p className="mt-1 text-sm font-semibold text-zinc-900">{form.phone || "Не подключён"}</p>
              </div>
              <div className="rounded-2xl bg-zinc-50 px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">Почта</p>
                <p className="mt-1 truncate text-sm font-semibold text-zinc-900">{form.email || "Не подключена"}</p>
              </div>
            </div>
            <div className="mt-3 space-y-2">
              {identity?.linkedProviders.map((item) => (
                <div key={item.key} className="flex items-center justify-between rounded-2xl border border-zinc-100 bg-zinc-50/80 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-zinc-800">{item.label}</p>
                    {item.hint && <p className="text-xs text-zinc-500">{item.hint}</p>}
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      item.connected ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-400"
                    }`}
                  >
                    {item.connected ? "Подключён" : "Нет"}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href={`/login?from=${settingsReturn}`}
                className="rounded-2xl border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
              >
                Войти по телефону
              </Link>
              <a
                href={`/api/auth/vk?next=${settingsReturn}`}
                className="rounded-2xl border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
              >
                Подключить VK
              </a>
              <a
                href={`/api/auth/yandex?next=${settingsReturn}`}
                className="rounded-2xl border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
              >
                Подключить Яндекс
              </a>
            </div>
          </section>

          <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm sm:p-7">
            <h2 className="text-xl font-semibold text-zinc-950">Уведомления</h2>
            <div className="mt-4 space-y-2">
              {NOTIFICATION_ITEMS.map((item) => (
                <div key={item.key} className="flex items-center justify-between gap-3 rounded-2xl bg-zinc-50 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-zinc-900">{item.label}</p>
                    <p className="text-xs text-zinc-500">{item.description}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNotifications((prev) => ({ ...prev, [item.key]: !prev[item.key] }))}
                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${
                      notifications[item.key] ? "bg-[hsl(var(--nashlo-orange))]" : "bg-zinc-200"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 rounded-full bg-white shadow transition ${
                        notifications[item.key] ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
            {notificationsSuccess && (
              <p className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">Уведомления сохранены</p>
            )}
            <button
              type="button"
              onClick={saveNotifications}
              disabled={savingNotifications}
              className="mt-4 h-11 rounded-2xl border border-zinc-200 bg-white px-5 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 disabled:opacity-50"
            >
              {savingNotifications ? "Сохраняем…" : "Сохранить уведомления"}
            </button>
          </section>

          <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-zinc-950">Активные сеансы</h2>
                <p className="mt-1 text-sm text-zinc-500">{sessions.length} устройств с доступом к аккаунту</p>
              </div>
              <Link href="/profile/security" className="text-sm font-semibold text-[hsl(var(--nashlo-orange))] hover:underline">
                Все сеансы →
              </Link>
            </div>
            <div className="mt-4 space-y-2">
              {sessions.slice(0, 3).map((session) => (
                <div key={session.id} className="rounded-2xl border border-zinc-100 bg-zinc-50 px-4 py-3">
                  <p className="text-sm font-semibold text-zinc-900">
                    {session.device || "Устройство"}
                    {session.current && (
                      <span className="ml-2 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                        Сейчас
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    {session.ip ? `${session.ip} · ` : ""}
                    {sessionLabel(session.lastActiveAt)}
                  </p>
                </div>
              ))}
              {sessions.length === 0 && <p className="text-sm text-zinc-500">Сеансы появятся после входа</p>}
            </div>
          </section>

          <section className="rounded-[28px] border border-red-100 bg-white p-5 shadow-sm sm:p-7">
            <h2 className="text-xl font-semibold text-zinc-950">Безопасность</h2>
            <p className="mt-1 text-sm text-zinc-500">Выход и удаление аккаунта.</p>
            <button
              type="button"
              onClick={logout}
              className="mt-4 h-11 rounded-2xl border border-zinc-200 px-5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
            >
              Выйти из аккаунта
            </button>
            <div className="mt-6 border-t border-zinc-100 pt-6">
              <p className="text-sm font-semibold text-red-700">Удалить аккаунт</p>
              <p className="mt-1 text-xs leading-5 text-zinc-500">
                Объявления будут сняты, вход отключён. Введите УДАЛИТЬ для подтверждения.
              </p>
              <input
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder="УДАЛИТЬ"
                className="mt-3 h-11 w-full max-w-xs rounded-2xl border border-red-200 px-4 text-sm outline-none focus:border-red-400"
              />
              <button
                type="button"
                onClick={deleteAccount}
                disabled={deleting}
                className="mt-3 h-11 rounded-2xl bg-red-600 px-5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? "Удаляем…" : "Удалить аккаунт навсегда"}
              </button>
            </div>
          </section>

          {error && <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
        </div>
      </div>
    </div>
  )
}
