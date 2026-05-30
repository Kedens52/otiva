"use client"

import { useEffect, useState } from "react"
import { X } from "lucide-react"

type Props = {
  open: boolean
  onClose: () => void
  companyId: string
  companyName: string
  listingId?: string
  listingTitle?: string
  type?: "PRICE_REQUEST" | "COMMERCIAL_OFFER"
}

export function BusinessInquiryModal({
  open,
  onClose,
  companyId,
  companyName,
  listingId,
  listingTitle,
  type = "PRICE_REQUEST",
}: Props) {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState("")
  const [form, setForm] = useState({
    contactName: "",
    contactCompany: "",
    contactPhone: "",
    contactEmail: "",
    quantity: "",
    city: "",
    message: "",
  })

  useEffect(() => {
    if (!open) return
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data?.user) return
        setForm((f) => ({
          ...f,
          contactName: data.user.name ?? f.contactName,
          contactPhone: data.user.phone ?? f.contactPhone,
          contactEmail: data.user.email ?? f.contactEmail,
        }))
        return fetch("/api/business/me")
      })
      .then((r) => (r?.ok ? r.json() : null))
      .then((biz) => {
        if (biz?.primary?.companyName) {
          setForm((f) => ({ ...f, contactCompany: biz.primary.companyName }))
        }
      })
      .catch(() => {})
  }, [open])

  if (!open) return null

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    const res = await fetch("/api/business/inquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        toCompanyId: companyId,
        businessListingId: listingId,
        type,
        ...form,
      }),
    })
    const data = await res.json().catch(() => ({}))
    setLoading(false)
    if (!res.ok) {
      setError(data.error ?? "Не удалось отправить запрос")
      return
    }
    setDone(true)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-zinc-950">
              {type === "COMMERCIAL_OFFER" ? "Запросить КП" : "Запросить прайс"}
            </h2>
            <p className="mt-1 text-sm text-zinc-500">{companyName}{listingTitle ? ` · ${listingTitle}` : ""}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100" aria-label="Закрыть">
            <X className="h-5 w-5" />
          </button>
        </div>

        {done ? (
          <p className="mt-6 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            Запрос отправлен. Компания получит его в бизнес-кабинете.
          </p>
        ) : (
          <form onSubmit={submit} className="mt-4 space-y-3">
            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}
            <input
              required
              placeholder="Имя *"
              className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
              value={form.contactName}
              onChange={(e) => setForm((f) => ({ ...f, contactName: e.target.value }))}
            />
            <input
              placeholder="Ваша компания"
              className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
              value={form.contactCompany}
              onChange={(e) => setForm((f) => ({ ...f, contactCompany: e.target.value }))}
            />
            <input
              required
              placeholder="Телефон *"
              className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
              value={form.contactPhone}
              onChange={(e) => setForm((f) => ({ ...f, contactPhone: e.target.value }))}
            />
            <input
              type="email"
              placeholder="Email"
              className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
              value={form.contactEmail}
              onChange={(e) => setForm((f) => ({ ...f, contactEmail: e.target.value }))}
            />
            <input
              placeholder="Количество / объём"
              className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
              value={form.quantity}
              onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
            />
            <input
              placeholder="Город поставки"
              className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
              value={form.city}
              onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
            />
            <textarea
              placeholder="Комментарий"
              rows={3}
              className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
              value={form.message}
              onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[hsl(var(--nashlo-orange))] py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {loading ? "Отправка…" : "Отправить"}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
