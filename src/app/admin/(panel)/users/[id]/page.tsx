"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { AdminPageBackLink } from "@/components/admin/layout/AdminPageBackLink"
import { AdminPageShell } from "@/components/admin/layout/AdminPageShell"
import { AdminStatusBadge } from "@/components/admin/ui/AdminStatusBadge"
import type { ReferralStatus } from "@prisma/client"
import { getAdminCsrfFromDocument } from "@/lib/admin/csrf-client"
import { AdminUserRiskSignals } from "@/components/admin/users/AdminUserRiskSignals"
import type { UserRiskSignal } from "@/lib/admin/user-risk-signals"
import { authSourceBadgeClass, inferUserAuthSource } from "@/lib/admin/user-auth-source"
import { badgeAssetFile, badgeMap, resolveBadgeIcon } from "@/lib/badges/badge-map"
import type { BadgeCode } from "@prisma/client"

const ISSUABLE_BADGES: BadgeCode[] = [
  "FIRST_STEP",
  "VERIFIED",
  "ACTIVE",
  "TRUSTED",
  "PRO",
  "SAFE_DEAL",
  "PREMIUM",
  "BEGINNER",
]

type Session = {
  id: string
  device: string | null
  userAgent: string | null
  ip: string | null
  lastActiveAt: string
  expiresAt: string
}

type Listing = {
  id: string
  title: string
  status: string
  price: number
  views: number
  uniqueViews: number
  rejectionReason: string | null
  createdAt: string
  category: { nameRu: string } | null
}

type Payment = {
  id: string
  orderId: string
  serviceType: string
  amount: number
  status: string
  createdAt: string
}

type WalletTx = {
  id: string
  type: string
  status: string
  amount: number
  balanceAfter: number
  title: string | null
  createdAt: string
}

type Report = {
  id: string
  reason: string
  comment: string
  status: string
  createdAt: string
  listing: { id: string; title: string } | null
}

type ModerationLog = {
  id: string
  action: string
  reason: string | null
  createdAt: string
  listing: { id: string; title: string } | null
  staff?: { id: string; login: string; displayName: string | null; role: string } | null
  moderator?: { id: string; name: string | null; phone: string | null } | null
}

type UserDetail = {
  id: string
  name: string | null
  phone: string | null
  email: string | null
  city: string | null
  avatar: string | null
  role: string
  profileType: string
  companyName: string | null
  companyInn: string | null
  isVerified: boolean
  emailVerified: boolean
  isBanned: boolean
  walletBalance: number
  rating: number
  reviewCount: number
  createdAt: string
  updatedAt: string
  lastLoginAt: string | null
  lastLoginIp: string | null
  lastSeenAt: string | null
  vkId: string | null
  yandexId: string | null
  phoneVerifiedAt: string | null
  emailVerifiedAt: string | null
  profileHeadline: string | null
  region: string | null
  district: string | null
  trustTier: string
  accountRestricted: boolean
  publicSlug: string | null
  listings: Listing[]
  sessions: Session[]
  payments: Payment[]
  walletTransactions: WalletTx[]
  referralCode: string | null
  referralsMade: {
    id: string
    status: ReferralStatus
    createdAt: string
    activatedAt: string | null
    referredUser: { id: string; name: string | null; phone: string | null; email: string | null; createdAt: string }
  }[]
  referralReceived: {
    id: string
    status: ReferralStatus
    createdAt: string
    activatedAt: string | null
    referrer: { id: string; name: string | null; phone: string | null; email: string | null; referralCode: string | null }
  } | null
  _count: { listings: number; reviews: number; favorites: number }
}

type SiteVisitRow = {
  id: string
  type: string
  path: string
  referrer: string | null
  ip: string | null
  userAgent: string | null
  visitorId: string
  createdAt: string
}

type RegistrationVisit = {
  path: string
  ip: string | null
  referrer: string | null
  createdAt: string
} | null

function fmt(n: number) {
  return new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(n / 100)
}

const TIER_LABELS: Record<string, string> = {
  NEW: "Новый",
  NORMAL: "Обычный",
  TRUSTED: "Надёжный",
  WATCH: "На проверке",
  HIGH_RISK: "Высокий риск",
  BLOCKED: "Заблокирован",
}

type UserBadgeRow = {
  id: string
  code: string
  title: string
  subtitle: string
  icon: string
  priority: number
  issuedAt: string
  expiresAt: string | null
  issuedBy: string
  reason: string | null
}

type TrustData = {
  trustScore: number
  riskScore: number
  accountLevel: string
  accountRestricted: boolean
  activeListings: number
  totalListings: number
  reportsLast30d: number
  rejectedListings: number
  duplicateListingGroups: number
  lastCalculatedAt: string | null
  recentEvents: { id: string; type: string; scoreDelta: number; reason: string | null; createdAt: string }[]
}

export default function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [data, setData] = useState<{
    user: UserDetail
    reports: Report[]
    moderationLogs: ModerationLog[]
    siteVisits?: SiteVisitRow[]
    registrationVisit?: RegistrationVisit
    riskSignals?: UserRiskSignal[]
  } | null>(null)
  const [trust, setTrust] = useState<TrustData | null>(null)
  const [loading, setLoading] = useState(true)
  const [trustLoading, setTrustLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [trustBusy, setTrustBusy] = useState(false)
  const [userBadges, setUserBadges] = useState<UserBadgeRow[]>([])
  const [badgesLoading, setBadgesLoading] = useState(true)
  const [badgesBusy, setBadgesBusy] = useState(false)
  const [tab, setTab] = useState<
    | "listings"
    | "sessions"
    | "activity"
    | "payments"
    | "wallet"
    | "reports"
    | "moderation"
    | "referrals"
  >("listings")

  async function loadBadges() {
    setBadgesLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${id}/badges`)
      const d = await res.json()
      if (d.badges) setUserBadges(d.badges)
    } catch {}
    setBadgesLoading(false)
  }

  async function loadTrust() {
    setTrustLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${id}/trust`)
      const d = await res.json()
      if (d.ok && d.trust) setTrust(d.trust)
    } catch {}
    setTrustLoading(false)
  }

  useEffect(() => {
    fetch(`/api/admin/users/${id}`)
      .then((r) => r.json())
      .then((d) => { if (d.ok) setData(d) })
      .catch(console.error)
      .finally(() => setLoading(false))
    void loadTrust()
    void loadBadges()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function badgeAction(action: "issue" | "revoke" | "sync", code?: string) {
    setBadgesBusy(true)
    try {
      const res = await fetch(`/api/admin/users/${id}/badges`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": getAdminCsrfFromDocument() },
        body: JSON.stringify({ action, code, reason: action === "issue" ? "Выдано в админке" : undefined }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        await loadBadges()
      } else {
        alert(data?.error ?? "Не удалось изменить значок")
      }
    } catch {
      alert("Ошибка сети при изменении значка")
    }
    setBadgesBusy(false)
  }

  async function patch(body: object) {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": getAdminCsrfFromDocument() },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        const d = await res.json()
        setData((prev) => prev ? { ...prev, user: { ...prev.user, ...d.user } } : prev)
      }
    } catch {}
    setSaving(false)
  }

  async function trustAction(url: string, method: "POST" = "POST") {
    setTrustBusy(true)
    try {
      const res = await fetch(url, {
        method,
        headers: { "X-CSRF-Token": getAdminCsrfFromDocument() },
      })
      if (res.ok) await loadTrust()
    } catch {}
    setTrustBusy(false)
  }

  if (loading) {
    return (
      <AdminPageShell>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-950" />
        </div>
      </AdminPageShell>
    )
  }

  if (!data) {
    return (
      <AdminPageShell>
        <div className="py-16 text-center">
          <p className="text-lg font-medium text-zinc-950">Пользователь не найден</p>
          <AdminPageBackLink label="К пользователям" href="/admin/users" className="mt-4 justify-center" />
        </div>
      </AdminPageShell>
    )
  }

  const { user, reports, moderationLogs, siteVisits = [], registrationVisit = null, riskSignals = [] } = data
  const authSource = inferUserAuthSource(user, registrationVisit?.path ?? null)

  return (
    <AdminPageShell>
      <AdminPageBackLink label="К пользователям" href="/admin/users" />

      {/* Profile card */}
      <div className="rounded-[28px] border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          {/* Avatar + name */}
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--nashlo-orange)/0.15)] text-2xl font-semibold text-[hsl(var(--nashlo-orange))]">
              {(user.name ?? user.phone ?? "?")[0].toUpperCase()}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold text-zinc-950">{user.name ?? "Без имени"}</h1>
                {user.isBanned && <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-600">Заблокирован</span>}
                {user.isVerified && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-600">✓ Верифицирован</span>}
                {user.profileType === "COMPANY" && <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-600">Бизнес</span>}
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${authSourceBadgeClass(authSource)}`}>
                  {authSource}
                </span>
                {user.trustTier === "HIGH_RISK" && (
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">HIGH_RISK</span>
                )}
              </div>
              <p className="mt-0.5 font-mono text-xs text-zinc-400">{user.id}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <button
              disabled={saving}
              onClick={() => patch({ isVerified: !user.isVerified })}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition disabled:opacity-50 ${user.isVerified ? "bg-zinc-100 text-zinc-700 hover:bg-zinc-200" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"}`}>
              {user.isVerified ? "Снять верификацию" : "Верифицировать"}
            </button>
            <button
              disabled={saving}
              onClick={() => patch({ isBanned: !user.isBanned })}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition disabled:opacity-50 ${user.isBanned ? "bg-zinc-100 text-zinc-700 hover:bg-zinc-200" : "bg-red-50 text-red-600 hover:bg-red-100"}`}>
              {user.isBanned ? "Разблокировать" : "Заблокировать"}
            </button>
            <Link href={`/profile/${user.id}`} target="_blank"
              className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 transition">
              Профиль ↗
            </Link>
          </div>
        </div>

        {/* Info grid */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Телефон",  value: user.phone ?? "—" },
            { label: "Email",    value: user.email ?? "—" },
            { label: "Город",    value: user.city ?? "—" },
            { label: "Роль",     value: user.role },
            {
              label: "Зарегистрирован",
              value: new Date(user.createdAt).toLocaleString("ru-RU"),
            },
            {
              label: "Способ регистрации",
              value: authSource,
            },
            {
              label: "Последний вход",
              value: user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString("ru-RU") : "—",
            },
            { label: "IP входа", value: user.lastLoginIp ?? "—" },
            {
              label: "Был на сайте",
              value: user.lastSeenAt ? new Date(user.lastSeenAt).toLocaleString("ru-RU") : "—",
            },
            { label: "Регион", value: [user.region, user.district].filter(Boolean).join(", ") || "—" },
            { label: "Уровень доверия", value: TIER_LABELS[user.trustTier] ?? user.trustTier },
            {
              label: "Рейтинг",
              value: user.rating > 0 ? `${user.rating.toFixed(1)} (${user.reviewCount} отз.)` : "Нет отзывов",
            },
            { label: "Реферальный код", value: user.referralCode ?? "—" },
            { label: "Публичный slug", value: user.publicSlug ?? "—" },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-2xl bg-zinc-50 p-3">
              <p className="text-xs text-zinc-400">{label}</p>
              <p className="mt-0.5 text-sm font-semibold text-zinc-950 break-all">{value}</p>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { v: user._count.listings, l: "Объявлений" },
            { v: user._count.reviews,  l: "Отзывов" },
            { v: user._count.favorites, l: "В избранном" },
            { v: reports.length,        l: "Жалоб" },
            { v: user.payments.length,  l: "Платежей" },
            { v: (user.walletBalance / 100).toFixed(0) + " ₽", l: "Баланс" },
          ].map(({ v, l }) => (
            <div key={l} className="rounded-2xl border border-zinc-100 bg-white p-3 text-center shadow-sm">
              <p className="text-xl font-semibold text-zinc-950">{v}</p>
              <p className="mt-0.5 text-xs text-zinc-400">{l}</p>
            </div>
          ))}
        </div>

        {/* Company info */}
        {user.companyName && (
          <div className="mt-4 rounded-2xl bg-blue-50 px-4 py-3">
            <p className="text-sm font-semibold text-blue-800">{user.companyName}</p>
            {user.companyInn && <p className="text-xs text-blue-600">ИНН: {user.companyInn}</p>}
          </div>
        )}

        <AdminUserRiskSignals signals={riskSignals} />

        {registrationVisit && (
          <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50/60 px-4 py-3 text-sm">
            <p className="font-semibold text-emerald-900">Событие регистрации</p>
            <p className="mt-1 text-emerald-800">
              {new Date(registrationVisit.createdAt).toLocaleString("ru-RU")} · {registrationVisit.path}
            </p>
            {registrationVisit.referrer && (
              <p className="mt-0.5 text-xs text-emerald-700">Источник перехода: {registrationVisit.referrer}</p>
            )}
            {registrationVisit.ip && (
              <p className="mt-0.5 text-xs text-emerald-700">IP: {registrationVisit.ip}</p>
            )}
          </div>
        )}
      </div>

      {/* User badges */}
      <div className="mt-6 rounded-[28px] border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-zinc-950">Уровень доверия Нашло</h2>
            <p className="mt-1 text-sm text-zinc-500">Значки пользователя, дата выдачи и источник.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={badgesBusy}
              onClick={() => badgeAction("sync")}
              className="rounded-xl bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-200 disabled:opacity-50"
            >
              Пересчитать (авто)
            </button>
          </div>
        </div>
        <p className="mt-3 text-xs text-zinc-500">
          «Пересчитать» оставляет только автоматические значки и выданные вручную (admin). Для выдачи вручную нажмите «Выдать».
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {ISSUABLE_BADGES.map((code) => {
            const def = badgeMap[code]
            const has = userBadges.some((b) => b.code === code)
            return (
              <div key={code} className="flex items-center gap-1 rounded-xl border border-zinc-200 bg-zinc-50 p-1">
                <span className="px-2 text-xs font-medium text-zinc-600">{def.title}</span>
                <button
                  type="button"
                  disabled={badgesBusy || has}
                  onClick={() => badgeAction("issue", code)}
                  className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-40"
                >
                  Выдать
                </button>
                <button
                  type="button"
                  disabled={badgesBusy || !has}
                  onClick={() => badgeAction("revoke", code)}
                  className="rounded-lg border border-zinc-200 px-2.5 py-1 text-xs font-semibold text-zinc-600 hover:bg-white disabled:opacity-40"
                >
                  Снять
                </button>
              </div>
            )
          })}
        </div>
        {badgesLoading ? (
          <div className="mt-4 h-16 animate-pulse rounded-2xl bg-zinc-100" />
        ) : userBadges.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-400">Активных значков нет</p>
        ) : (
          <div className="mt-4 overflow-hidden rounded-2xl border border-zinc-100">
            <div className="divide-y divide-zinc-100">
              {userBadges.map((b) => (
                <div key={b.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
                  <div className="flex min-w-0 items-center gap-3">
                    <img
                      src={resolveBadgeIcon(b.code, b.icon)}
                      alt=""
                      className="h-8 w-8 shrink-0 object-contain"
                      onError={(e) => {
                        const el = e.currentTarget
                        if (!el.dataset.fallback) {
                          el.dataset.fallback = "1"
                          el.src = `/badges/${badgeAssetFile(b.code)}`
                        }
                      }}
                    />
                    <div>
                      <p className="font-semibold text-zinc-900">{b.title}</p>
                      <p className="text-xs text-zinc-500">{b.subtitle} · {b.code}</p>
                      {b.reason ? <p className="mt-0.5 text-xs text-zinc-400">{b.reason}</p> : null}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2 text-xs text-zinc-500">
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 font-semibold">{b.issuedBy}</span>
                    <span>{new Date(b.issuedAt).toLocaleString("ru-RU")}</span>
                    {b.expiresAt ? <span>до {new Date(b.expiresAt).toLocaleDateString("ru-RU")}</span> : null}
                    <button
                      type="button"
                      disabled={badgesBusy}
                      onClick={() => badgeAction("revoke", b.code)}
                      className="rounded-lg border border-red-200 px-2 py-1 font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      Снять
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Trust & risk */}
      <div className="mt-6 rounded-[28px] border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-zinc-950">Доверие и риски</h2>
            <p className="mt-1 text-sm text-zinc-500">Уровень аккаунта, ограничения и события доверия.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={trustBusy}
              onClick={() => trustAction(`/api/admin/users/${id}/trust/recalculate`)}
              className="rounded-xl bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-200 disabled:opacity-50"
            >
              Пересчитать
            </button>
            {trust?.accountRestricted ? (
              <button
                type="button"
                disabled={trustBusy}
                onClick={() => trustAction(`/api/admin/users/${id}/unrestrict`)}
                className="rounded-xl bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
              >
                Снять ограничение
              </button>
            ) : (
              <button
                type="button"
                disabled={trustBusy}
                onClick={() => trustAction(`/api/admin/users/${id}/restrict`)}
                className="rounded-xl bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 hover:bg-amber-100 disabled:opacity-50"
              >
                Ограничить аккаунт
              </button>
            )}
          </div>
        </div>

        {trustLoading ? (
          <div className="mt-4 h-20 animate-pulse rounded-2xl bg-zinc-100" />
        ) : trust ? (
          <>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Уровень", value: TIER_LABELS[trust.accountLevel] ?? trust.accountLevel },
                { label: "Trust score", value: trust.trustScore },
                { label: "Risk score", value: trust.riskScore },
                { label: "Жалобы (30д)", value: trust.reportsLast30d },
                { label: "Отклонённых", value: trust.rejectedListings },
                { label: "Дублей заголовков", value: trust.duplicateListingGroups },
                { label: "Активных объявлений", value: trust.activeListings },
                {
                  label: "Ограничен",
                  value: trust.accountRestricted ? "Да" : "Нет",
                },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-2xl bg-zinc-50 p-3">
                  <p className="text-xs text-zinc-400">{label}</p>
                  <p className="mt-0.5 text-sm font-semibold text-zinc-950">{value}</p>
                </div>
              ))}
            </div>

            {trust.recentEvents.length > 0 ? (
              <div className="mt-4 overflow-hidden rounded-2xl border border-zinc-100">
                <div className="border-b border-zinc-100 bg-zinc-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Последние события
                </div>
                <div className="divide-y divide-zinc-100">
                  {trust.recentEvents.slice(0, 8).map((event) => (
                    <div key={event.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                      <div className="min-w-0">
                        <p className="font-medium text-zinc-900">{event.type}</p>
                        {event.reason ? <p className="truncate text-xs text-zinc-500">{event.reason}</p> : null}
                      </div>
                      <div className="shrink-0 text-right">
                        <p className={`font-semibold ${event.scoreDelta >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                          {event.scoreDelta >= 0 ? "+" : ""}{event.scoreDelta}
                        </p>
                        <p className="text-xs text-zinc-400">
                          {new Date(event.createdAt).toLocaleString("ru-RU")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </>
        ) : (
          <p className="mt-4 text-sm text-zinc-400">Не удалось загрузить данные доверия</p>
        )}
      </div>

      {/* Tab nav */}
      <div className="mt-6 flex gap-2 overflow-x-auto pb-1">
        {([
          ["listings",   `Объявления (${user.listings.length})`],
          ["sessions",   `Устройства (${user.sessions.length})`],
          ["activity",   `Активность (${siteVisits.length})`],
          ["payments",   `Платежи (${user.payments.length})`],
          ["wallet",     `Кошелёк (${user.walletTransactions.length})`],
          ["reports",    `Жалобы (${reports.length})`],
          ["moderation", `Модерация (${moderationLogs.length})`],
          ["referrals", `Рефералы (${user.referralsMade.length}${user.referralReceived ? "+1" : ""})`],
        ] as const).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`shrink-0 rounded-xl px-4 py-2 text-sm font-semibold transition ${tab === key ? "bg-zinc-950 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="mt-4 overflow-hidden rounded-[24px] border border-zinc-200 bg-white shadow-sm">
        {/* Listings */}
        {tab === "listings" && (
          user.listings.length === 0 ? <Empty text="Объявлений нет" /> : (
            <div className="divide-y divide-zinc-100">
              {user.listings.map((l) => (
                <div key={l.id} className="flex items-center gap-4 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-zinc-950">{l.title}</p>
                    <p className="text-xs text-zinc-400">{l.category?.nameRu} · {new Date(l.createdAt).toLocaleDateString("ru-RU")}</p>
                    {l.rejectionReason && <p className="mt-0.5 text-xs text-red-500">Причина: {l.rejectionReason}</p>}
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-xs text-zinc-400">{l.uniqueViews} уник. / {l.views} всего</span>
                    <AdminStatusBadge variant="listing" status={l.status} />
                    <Link href={`/listings/${l.id}`} target="_blank"
                      className="rounded-lg border border-zinc-200 px-2 py-1 text-xs font-semibold text-zinc-600 hover:bg-zinc-50">
                      ↗
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* Sessions */}
        {tab === "activity" && (
          siteVisits.length === 0 ? (
            <Empty text="Заходов на сайт не зафиксировано" />
          ) : (
            <div className="divide-y divide-zinc-100">
              {siteVisits.map((v) => (
                <div key={v.id} className="px-5 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-mono text-sm font-semibold text-zinc-950">{v.path}</p>
                    <span className="text-xs text-zinc-400">
                      {new Date(v.createdAt).toLocaleString("ru-RU")}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    {v.type === "REGISTRATION" ? "Регистрация" : "Просмотр"}
                    {v.referrer ? ` · откуда: ${v.referrer}` : ""}
                  </p>
                  {(v.ip || v.userAgent) && (
                    <p className="mt-1 break-all text-xs text-zinc-400">
                      {v.ip && <>IP {v.ip}</>}
                      {v.ip && v.userAgent && " · "}
                      {v.userAgent}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )
        )}

        {tab === "sessions" && (
          user.sessions.length === 0 ? <Empty text="Активных сессий нет" /> : (
            <div className="divide-y divide-zinc-100">
              {user.sessions.map((s) => (
                <div key={s.id} className="px-5 py-3">
                  <p className="font-semibold text-zinc-950 text-sm">{s.device ?? s.userAgent?.slice(0, 60) ?? "Неизвестное устройство"}</p>
                  <p className="text-xs text-zinc-400">IP: {s.ip ?? "—"} · Последняя активность: {new Date(s.lastActiveAt).toLocaleString("ru-RU")}</p>
                  <p className="text-xs text-zinc-400">Истекает: {new Date(s.expiresAt).toLocaleString("ru-RU")}</p>
                </div>
              ))}
            </div>
          )
        )}

        {/* Payments */}
        {tab === "payments" && (
          user.payments.length === 0 ? <Empty text="Платежей нет" /> : (
            <div className="divide-y divide-zinc-100">
              {user.payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="font-semibold text-zinc-950 text-sm">{p.serviceType}</p>
                    <p className="text-xs text-zinc-400">{p.orderId} · {new Date(p.createdAt).toLocaleString("ru-RU")}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-zinc-950">{fmt(p.amount)}</p>
                    <AdminStatusBadge variant="payment" status={p.status} />
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* Wallet */}
        {tab === "wallet" && (
          user.walletTransactions.length === 0 ? <Empty text="Транзакций нет" /> : (
            <div className="divide-y divide-zinc-100">
              {user.walletTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="font-semibold text-zinc-950 text-sm">{tx.title ?? tx.type}</p>
                    <p className="text-xs text-zinc-400">{new Date(tx.createdAt).toLocaleString("ru-RU")}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold text-sm ${tx.amount > 0 ? "text-emerald-600" : "text-red-600"}`}>
                      {tx.amount > 0 ? "+" : ""}{fmt(tx.amount)}
                    </p>
                    <p className="text-xs text-zinc-400">Баланс: {fmt(tx.balanceAfter)}</p>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* Reports */}
        {tab === "reports" && (
          reports.length === 0 ? <Empty text="Жалоб на этого пользователя нет" /> : (
            <div className="divide-y divide-zinc-100">
              {reports.map((r) => (
                <div key={r.id} className="px-5 py-3">
                  <p className="font-semibold text-zinc-950 text-sm">{r.listing?.title ?? r.listing?.id ?? "—"}</p>
                  <p className="text-sm text-zinc-600">{r.reason}</p>
                  {r.comment && <p className="text-xs text-zinc-400">«{r.comment}»</p>}
                  <p className="text-xs text-zinc-400">{new Date(r.createdAt).toLocaleDateString("ru-RU")} · {r.status}</p>
                </div>
              ))}
            </div>
          )
        )}

        {/* Moderation */}
        {tab === "referrals" && (
          <div className="space-y-4 p-5">
            {user.referralCode && (
              <div className="rounded-2xl bg-zinc-50 px-4 py-3">
                <p className="text-xs text-zinc-500">Реферальный код</p>
                <p className="mt-1 font-mono text-lg font-bold text-zinc-950">{user.referralCode}</p>
                <Link
                  href={`/admin/referrals?q=${encodeURIComponent(user.referralCode)}`}
                  className="mt-2 inline-block text-xs font-semibold text-[hsl(var(--nashlo-orange))] hover:underline"
                >
                  Все приглашения по коду →
                </Link>
              </div>
            )}
            {user.referralReceived && (
              <div className="rounded-2xl border border-amber-100 bg-amber-50/50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">Пригласил этого пользователя</p>
                <p className="mt-2 text-sm font-semibold text-zinc-950">
                  <Link href={`/admin/users/${user.referralReceived.referrer.id}`} className="hover:underline">
                    {user.referralReceived.referrer.name ?? user.referralReceived.referrer.phone ?? "—"}
                  </Link>
                  {user.referralReceived.referrer.referralCode && (
                    <span className="ml-2 font-mono text-xs text-zinc-500">
                      {user.referralReceived.referrer.referralCode}
                    </span>
                  )}
                </p>
                <p className="mt-2 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                  <AdminStatusBadge variant="referral" status={user.referralReceived.status} />
                  <span>{new Date(user.referralReceived.createdAt).toLocaleString("ru-RU")}</span>
                </p>
              </div>
            )}
            <div>
              <p className="text-sm font-semibold text-zinc-950">Приглашённые пользователи ({user.referralsMade.length})</p>
              {user.referralsMade.length === 0 ? (
                <p className="mt-2 text-sm text-zinc-500">Никого не пригласил</p>
              ) : (
                <div className="mt-3 divide-y divide-zinc-100 rounded-2xl border border-zinc-100">
                  {user.referralsMade.map((r) => (
                    <div key={r.id} className="flex items-center justify-between gap-3 px-4 py-3">
                      <div>
                        <Link
                          href={`/admin/users/${r.referredUser.id}`}
                          className="font-semibold text-zinc-950 hover:underline"
                        >
                          {r.referredUser.name ?? r.referredUser.phone ?? r.referredUser.email ?? r.referredUser.id}
                        </Link>
                        <p className="text-xs text-zinc-400">
                          Регистрация связи: {new Date(r.createdAt).toLocaleString("ru-RU")}
                        </p>
                      </div>
                      <AdminStatusBadge variant="referral" status={r.status} className="shrink-0" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "moderation" && (
          moderationLogs.length === 0 ? <Empty text="Записей модерации нет" /> : (
            <div className="divide-y divide-zinc-100">
              {moderationLogs.map((m) => (
                <div key={m.id} className="flex items-start justify-between gap-4 px-5 py-3">
                  <div>
                    <p className="font-semibold text-zinc-950 text-sm">{m.listing?.title ?? "—"}</p>
                    {m.reason && <p className="text-xs text-zinc-500">Причина: {m.reason}</p>}
                    {(m.staff || m.moderator) && (
                      <p className="text-xs text-zinc-400">
                        Модератор: {m.staff?.displayName ?? m.staff?.login ?? m.moderator?.name ?? m.moderator?.phone}
                      </p>
                    )}
                    <p className="text-xs text-zinc-400">{new Date(m.createdAt).toLocaleString("ru-RU")}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${m.action === "APPROVED" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
                    {m.action === "APPROVED" ? "Одобрено" : "Отклонено"}
                  </span>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </AdminPageShell>
  )
}

function Empty({ text }: { text: string }) {
  return <div className="py-12 text-center text-sm text-zinc-400">{text}</div>
}
