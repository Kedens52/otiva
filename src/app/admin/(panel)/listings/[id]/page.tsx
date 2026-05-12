"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { formatPrice } from "@/lib/listing-types"
import { getAdminCsrfFromDocument } from "@/lib/admin/csrf-client"

type ListingDetail = {
  id: string
  title: string
  description: string
  price: number
  status: string
  city: string | null
  location: string | null
  images: string[]
  video: string | null
  views: number
  uniqueViews: number
  rejectionReason: string | null
  autoApproved: boolean
  createdAt: string
  updatedAt: string
  attributes: Record<string, unknown> | null
  category: { id: string; slug: string; nameRu: string }
  seller: {
    id: string
    name: string | null
    phone: string | null
    email: string | null
    city: string | null
    avatar: string | null
    isVerified: boolean
    isBanned: boolean
    rating: number
    reviewCount: number
    createdAt: string
    lastLoginAt: string | null
    lastLoginIp: string | null
    vkId: string | null
    yandexId: string | null
    phoneVerifiedAt: string | null
    emailVerified: boolean
  }
  moderationLogs: Array<{
    id: string
    action: string
    reason: string | null
    createdAt: string
    staff: { login: string; displayName: string | null; role: string } | null
    moderator: { name: string | null; phone: string | null } | null
  }>
  reports: Array<{ id: string; reason: string; comment: string; status: string; createdAt: string }>
  payments: Array<{ id: string; orderId: string; amount: number; status: string; serviceType: string; createdAt: string }>
  _count: { favorites: number; reports: number; conversations: number; listingViews: number }
}

const STATUS_LABEL: Record<string, string> = {
  MODERATION: "На проверке",
  ACTIVE: "Активно",
  REJECTED: "Отклонено",
  ARCHIVED: "Архив",
  SOLD: "Продано",
}

const STATUS_COLOR: Record<string, string> = {
  MODERATION: "bg-amber-50 text-amber-700",
  ACTIVE: "bg-emerald-50 text-emerald-700",
  REJECTED: "bg-red-50 text-red-600",
  ARCHIVED: "bg-zinc-100 text-zinc-500",
  SOLD: "bg-blue-50 text-blue-600",
}

export default function AdminListingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [listing, setListing] = useState<ListingDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionError, setActionError] = useState("")
  const [actionPending, setActionPending] = useState("")
  const [reason, setReason] = useState("")

  async function load() {
    setLoading(true)
    const res = await fetch(`/api/admin/listings/${id}`)
    const data = await res.json().catch(() => null)
    if (res.ok && data?.listing) setListing(data.listing)
    setLoading(false)
  }

  useEffect(() => {
    load().catch(() => setLoading(false))
  }, [id])

  async function moderate(action: "APPROVED" | "REJECTED") {
    setActionError("")
    if (action === "REJECTED" && !reason.trim()) {
      setActionError("Укажите причину отклонения.")
      return
    }
    setActionPending(action)
    const res = await fetch("/api/admin/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-CSRF-Token": getAdminCsrfFromDocument() },
      body: JSON.stringify({ listingId: id, action, reason: reason.trim() || undefined }),
    })
    const data = await res.json().catch(() => null)
    if (res.ok) {
      await load()
      setReason("")
    } else {
      setActionError(data?.error ?? "Не удалось выполнить действие.")
    }
    setActionPending("")
  }

  if (loading) {
    return <div className="px-6 py-16 text-center text-sm text-zinc-400">Загрузка...</div>
  }

  if (!listing) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <p className="text-lg font-semibold text-white">Объявление не найдено</p>
        <button onClick={() => router.back()} className="mt-4 text-sm text-zinc-400 hover:text-white">Назад</button>
      </div>
    )
  }

  const mainImage = listing.images?.[0]

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <button onClick={() => router.back()} className="mb-5 text-sm font-semibold text-zinc-400 hover:text-white">
        ← Назад к объявлениям
      </button>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <section className="overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-sm">
          <div className="grid gap-6 p-5 lg:grid-cols-[300px_minmax(0,1fr)]">
            <div className="overflow-hidden rounded-[24px] bg-zinc-100">
              {mainImage ? (
                <img src={mainImage} alt="" className="h-72 w-full object-cover" />
              ) : (
                <div className="flex h-72 items-center justify-center text-sm text-zinc-400">Нет фото</div>
              )}
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLOR[listing.status] ?? "bg-zinc-100 text-zinc-600"}`}>
                  {STATUS_LABEL[listing.status] ?? listing.status}
                </span>
                {listing.autoApproved && (
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    Автомодерация
                  </span>
                )}
              </div>

              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950">{listing.title}</h1>
              <p className="mt-2 text-2xl font-semibold text-zinc-950">{formatPrice(listing.price)}</p>
              <p className="mt-2 text-sm text-zinc-500">
                {listing.city ?? "Город не указан"} · {listing.category.nameRu} · {new Date(listing.createdAt).toLocaleString("ru-RU")}
              </p>
              <p className="mt-5 whitespace-pre-wrap text-sm leading-6 text-zinc-600">{listing.description}</p>

              {listing.rejectionReason && (
                <div className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                  Причина отклонения: {listing.rejectionReason}
                </div>
              )}

              {listing.attributes && Object.keys(listing.attributes).length > 0 && (
                <div className="mt-5 grid gap-2 sm:grid-cols-2">
                  {Object.entries(listing.attributes).map(([key, value]) => (
                    <div key={key} className="rounded-2xl bg-zinc-50 px-4 py-3">
                      <p className="text-xs text-zinc-400">{key}</p>
                      <p className="mt-0.5 text-sm font-semibold text-zinc-950">{String(value)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {listing.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto border-t border-zinc-100 px-5 py-4">
              {listing.images.map((image) => (
                <img key={image} src={image} alt="" className="h-20 w-20 shrink-0 rounded-2xl object-cover" />
              ))}
            </div>
          )}
        </section>

        <aside className="space-y-4">
          <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-zinc-950">Действия</h2>
            {actionError && (
              <div className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                {actionError}
              </div>
            )}
            <div className="mt-4 grid gap-2">
              <button
                onClick={() => moderate("APPROVED")}
                disabled={actionPending === "APPROVED"}
                className="rounded-2xl bg-zinc-950 px-4 py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
              >
                {actionPending === "APPROVED" ? "Одобряем..." : "Одобрить"}
              </button>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder="Причина отклонения"
                className="resize-none rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none focus:border-zinc-400"
              />
              <button
                onClick={() => moderate("REJECTED")}
                disabled={actionPending === "REJECTED"}
                className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50"
              >
                {actionPending === "REJECTED" ? "Отклоняем..." : "Отклонить"}
              </button>
              <Link href={`/listings/${listing.id}`} target="_blank"
                className="rounded-2xl border border-zinc-200 px-4 py-3 text-center text-sm font-semibold text-zinc-700 hover:bg-zinc-50">
                Открыть на сайте ↗
              </Link>
            </div>
          </section>

          <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-zinc-950">Продавец</h2>
            <Link href={`/admin/users/${listing.seller.id}`} className="mt-3 flex items-center gap-3 hover:opacity-80">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--nashlo-orange)/0.15)] text-sm font-semibold text-[hsl(var(--nashlo-orange))]">
                {(listing.seller.name ?? listing.seller.phone ?? "?")[0].toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate font-semibold text-zinc-950">{listing.seller.name ?? "Без имени"}</p>
                <p className="truncate text-xs text-zinc-500">{listing.seller.phone ?? listing.seller.email ?? "Контакты не указаны"}</p>
              </div>
            </Link>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {listing.seller.isVerified && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">Проверен</span>}
              {listing.seller.phoneVerifiedAt && <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">Телефон</span>}
              {listing.seller.emailVerified && <span className="rounded-full bg-violet-50 px-2 py-0.5 text-xs font-semibold text-violet-700">Email</span>}
              {listing.seller.vkId && <span className="rounded-full bg-sky-50 px-2 py-0.5 text-xs font-semibold text-sky-700">VK</span>}
              {listing.seller.yandexId && <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-600">Яндекс</span>}
              {listing.seller.isBanned && <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-600">Бан</span>}
            </div>
          </section>

          <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-zinc-950">Статистика</h2>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {[
                ["Просмотры", listing.views],
                ["Уникальные", listing.uniqueViews],
                ["В избранном", listing._count.favorites],
                ["Чаты", listing._count.conversations],
                ["Жалобы", listing._count.reports],
                ["Fingerprint", listing._count.listingViews],
              ].map(([label, value]) => (
                <div key={String(label)} className="rounded-2xl bg-zinc-50 px-3 py-3 text-center">
                  <p className="text-lg font-semibold text-zinc-950">{value}</p>
                  <p className="text-xs text-zinc-500">{label}</p>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-950">История модерации</h2>
          <div className="mt-4 divide-y divide-zinc-100">
            {listing.moderationLogs.length === 0 ? (
              <p className="py-6 text-sm text-zinc-400">Записей пока нет</p>
            ) : listing.moderationLogs.map((log) => (
              <div key={log.id} className="py-3">
                <p className="text-sm font-semibold text-zinc-950">{log.action === "APPROVED" ? "Одобрено" : "Отклонено"}</p>
                {log.reason && <p className="text-sm text-zinc-500">Причина: {log.reason}</p>}
                <p className="text-xs text-zinc-400">
                  {new Date(log.createdAt).toLocaleString("ru-RU")} · {log.staff?.displayName ?? log.staff?.login ?? log.moderator?.name ?? "Система"}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-950">Жалобы и платежи</h2>
          <div className="mt-4 space-y-4">
            <div>
              <p className="text-sm font-semibold text-zinc-700">Жалобы</p>
              {listing.reports.length === 0 ? (
                <p className="mt-1 text-sm text-zinc-400">Нет жалоб</p>
              ) : listing.reports.map((report) => (
                <div key={report.id} className="mt-2 rounded-2xl bg-zinc-50 px-4 py-3">
                  <p className="text-sm font-semibold text-zinc-950">{report.reason}</p>
                  {report.comment && <p className="text-sm text-zinc-500">{report.comment}</p>}
                  <p className="text-xs text-zinc-400">{report.status} · {new Date(report.createdAt).toLocaleString("ru-RU")}</p>
                </div>
              ))}
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-700">Платежи</p>
              {listing.payments.length === 0 ? (
                <p className="mt-1 text-sm text-zinc-400">Нет платежей</p>
              ) : listing.payments.map((payment) => (
                <div key={payment.id} className="mt-2 rounded-2xl bg-zinc-50 px-4 py-3">
                  <p className="text-sm font-semibold text-zinc-950">{payment.serviceType} · {formatPrice(payment.amount)}</p>
                  <p className="text-xs text-zinc-400">{payment.status} · {payment.orderId}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
