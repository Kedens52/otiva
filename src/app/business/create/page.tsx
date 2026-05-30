"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { BUSINESS_CATEGORIES } from "@/lib/business/config"

export default function BusinessCreateListingPage() {
  const router = useRouter()
  const [companyId, setCompanyId] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    type: "WHOLESALE_OFFER",
    category: "wholesale",
    title: "",
    description: "",
    price: "",
    city: "",
    minOrderQuantity: "",
  })

  useEffect(() => {
    fetch("/api/business/companies")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const first = d?.items?.[0]
        if (!first) router.replace("/business/register")
        else setCompanyId(first.id)
      })
  }, [router])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!companyId) return
    setLoading(true)
    setError("")
    const res = await fetch("/api/business/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        companyId,
        type: form.type,
        category: form.category,
        title: form.title,
        description: form.description,
        price: Number(form.price) || 0,
        city: form.city || undefined,
        minOrderQuantity: form.minOrderQuantity ? Number(form.minOrderQuantity) : undefined,
      }),
    })
    const data = await res.json().catch(() => ({}))
    setLoading(false)
    if (!res.ok) {
      setError(data.error ?? "Ошибка")
      return
    }
    router.push("/business/dashboard")
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-2xl font-bold">B2B-объявление</h1>
      <p className="mt-1 text-sm text-zinc-500">После создания — модерация B2B-отдела</p>
      <form onSubmit={submit} className="mt-6 space-y-4 rounded-2xl border border-zinc-200 bg-white p-6">
        {error && <p className="text-sm text-red-700">{error}</p>}
        <label>
          <span className="text-sm font-medium">Тип</span>
          <select className="mt-1 w-full rounded-xl border px-3 py-2" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
            {BUSINESS_CATEGORIES.map((c) => (
              <option key={c.listingType} value={c.listingType}>{c.label}</option>
            ))}
          </select>
        </label>
        <label>
          <span className="text-sm font-medium">Заголовок *</span>
          <input required className="mt-1 w-full rounded-xl border px-3 py-2" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
        </label>
        <label>
          <span className="text-sm font-medium">Описание *</span>
          <textarea required rows={6} className="mt-1 w-full rounded-xl border px-3 py-2" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
        </label>
        <label>
          <span className="text-sm font-medium">Цена (₽)</span>
          <input type="number" className="mt-1 w-full rounded-xl border px-3 py-2" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} />
        </label>
        <label>
          <span className="text-sm font-medium">Мин. партия (шт.)</span>
          <input type="number" className="mt-1 w-full rounded-xl border px-3 py-2" value={form.minOrderQuantity} onChange={(e) => setForm((f) => ({ ...f, minOrderQuantity: e.target.value }))} />
        </label>
        <button type="submit" disabled={loading} className="w-full rounded-xl bg-[hsl(var(--nashlo-orange))] py-3 text-sm font-semibold text-white">
          {loading ? "Сохранение…" : "Отправить на модерацию"}
        </button>
        <Link href="/legal/business-listing-rules" className="block text-center text-xs text-zinc-500 underline">
          Правила B2B-объявлений
        </Link>
      </form>
    </div>
  )
}
