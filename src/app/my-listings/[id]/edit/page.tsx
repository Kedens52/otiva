"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { MarketPricePanel } from "@/components/marketplace/MarketPricePanel"

const CITIES = [
  "Москва","Санкт-Петербург","Казань","Екатеринбург","Новосибирск",
  "Сочи","Краснодар","Нижний Новгород","Самара","Ростов-на-Дону",
  "Уфа","Воронеж","Пермь","Тюмень","Омск","Красноярск","Волгоград",
  "Иркутск","Хабаровск","Владивосток","Ставрополь","Тула","Калининград",
]

type Listing = {
  id: string
  title: string
  description: string
  price: number
  city: string | null
  images: string[]
  video?: string | null
  status: string
  category?: { slug: string }
  attributes?: Record<string, unknown>
}

export default function EditListingPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [listing, setListing] = useState<Listing | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [images, setImages] = useState<string[]>([])
  const [video, setVideo] = useState("")
  const photoInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    city: "",
    free: false,
  })
  const [priceAnomalyReason, setPriceAnomalyReason] = useState("")

  useEffect(() => {
    async function load() {
      const meRes = await fetch("/api/auth/me")
      if (!meRes.ok) { router.push("/login"); return }

      const res = await fetch(`/api/listings/${params.id}`)
      if (!res.ok) { router.push("/my-listings"); return }
      const data = await res.json()
      const l: Listing = data.listing
      setListing(l)
      setForm({
        title: l.title,
        description: l.description,
        price: l.price === 0 ? "" : String(l.price),
        city: l.city || "",
        free: l.price === 0,
      })
      setImages((l.images || []).filter(Boolean))
      setVideo(l.video || "")
      setLoading(false)
    }
    load()
  }, [params.id, router]) // eslint-disable-line react-hooks/exhaustive-deps

  async function uploadFile(file: File, type: "image" | "video") {
    setUploading(true)
    const fd = new FormData()
    fd.append("file", file)
    fd.append("type", type)
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      if (type === "image") setImages((prev) => [...prev, data.url])
      else setVideo(data.url)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка загрузки")
    } finally {
      setUploading(false)
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) return setError("Введите название")
    if (!form.free && (!form.price || isNaN(Number(form.price)))) return setError("Введите цену")
    setSaving(true)
    setError("")
    try {
      const res = await fetch(`/api/listings/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim() || form.title.trim(),
          price: form.free ? 0 : Number(form.price),
          city: form.city || undefined,
          images: images.length ? images : undefined,
          video: video || undefined,
          ...(priceAnomalyReason.trim() ? { priceAnomalyReason: priceAnomalyReason.trim() } : {}),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Ошибка сохранения")
      setSuccess(true)
      setTimeout(() => router.push("/my-listings"), 1200)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Ошибка сохранения")
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-950" />
      </main>
    )
  }
  if (!listing) return null

  return (
    <main className="mx-auto max-w-2xl px-4 py-10 pb-28 lg:pb-10">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/my-listings" className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-100 text-zinc-500 hover:bg-zinc-200">←</Link>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">Редактировать объявление</h1>
      </div>

      {success && (
        <div className="mb-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          Изменения сохранены ✓
        </div>
      )}

      <form onSubmit={save} className="space-y-5">
        <label className="block">
          <span className="text-sm font-medium text-zinc-700">Название <span className="text-red-500">*</span></span>
          <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            maxLength={100}
            className="mt-1.5 h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm outline-none transition focus:border-[hsl(var(--nashlo-orange))] focus:bg-white" />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-zinc-700">Описание</span>
          <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            rows={5} maxLength={3000}
            className="mt-1.5 w-full resize-none rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm outline-none transition focus:border-[hsl(var(--nashlo-orange))] focus:bg-white" />
          <p className="mt-1 text-right text-xs text-zinc-400">{form.description.length}/3000</p>
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-zinc-700">Цена, ₽ <span className="text-red-500">*</span></label>
            <div className="relative mt-1.5">
              <input type="number" min="0" value={form.free ? "" : form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                disabled={form.free} placeholder={form.free ? "Бесплатно" : "0"}
                className="h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 pr-8 text-sm outline-none transition focus:border-[hsl(var(--nashlo-orange))] focus:bg-white disabled:text-zinc-400" />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-zinc-400">₽</span>
            </div>
            <label className="mt-2 flex cursor-pointer items-center gap-2 text-sm text-zinc-500">
              <input type="checkbox" checked={form.free} onChange={(e) => setForm((f) => ({ ...f, free: e.target.checked }))} />
              Бесплатно
            </label>
            {listing?.category?.slug ? (
              <MarketPricePanel
                categorySlug={listing.category.slug}
                price={form.free ? 0 : Number(form.price) || 0}
                city={form.city}
                attributes={(listing.attributes as Record<string, unknown>) ?? {}}
                excludeListingId={listing.id}
                disabled={form.free}
                reason={priceAnomalyReason}
                onReasonChange={setPriceAnomalyReason}
              />
            ) : null}
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700">Город</label>
            <select value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
              className="mt-1.5 h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm outline-none transition focus:border-[hsl(var(--nashlo-orange))] focus:bg-white">
              <option value="">Не указан</option>
              {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Photos */}
        <div>
          <p className="mb-2 text-sm font-medium text-zinc-700">Фотографии <span className="text-zinc-400">(до 10)</span></p>
          <div className="flex flex-wrap gap-2">
            {images.map((url, i) => (
              <div key={i} className="relative h-24 w-24 overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50">
                <img src={url} alt="" className="h-full w-full object-cover" />
                <button type="button" onClick={() => setImages((prev) => prev.filter((_, j) => j !== i))}
                  className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-[10px] text-white">✕</button>
              </div>
            ))}
            {images.length < 10 && (
              <button type="button" onClick={() => photoInputRef.current?.click()} disabled={uploading}
                className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-zinc-200 text-zinc-400 hover:border-zinc-400 disabled:opacity-50">
                <span className="text-2xl">+</span>
                <span className="text-[10px]">Фото</span>
              </button>
            )}
            <input ref={photoInputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden"
              onChange={(e) => { Array.from(e.target.files || []).slice(0, 10 - images.length).forEach((f) => uploadFile(f, "image")); e.target.value = "" }} />
          </div>
        </div>

        {/* Video */}
        <div>
          <p className="mb-2 text-sm font-medium text-zinc-700">Видео <span className="text-zinc-400">(необязательно)</span></p>
          {video ? (
            <div className="relative overflow-hidden rounded-2xl border border-zinc-200">
              <video src={video} controls className="max-h-48 w-full" />
              <button type="button" onClick={() => setVideo("")}
                className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-xs text-white">✕</button>
            </div>
          ) : (
            <button type="button" onClick={() => videoInputRef.current?.click()} disabled={uploading}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-zinc-200 text-sm text-zinc-400 hover:border-zinc-400 disabled:opacity-50">
              ▶ Загрузить видео
            </button>
          )}
          <input ref={videoInputRef} type="file" accept="video/mp4,video/webm,video/quicktime" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f, "video"); e.target.value = "" }} />
        </div>

        {error && <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

        <button type="submit" disabled={saving}
          className="h-12 w-full rounded-2xl bg-[hsl(var(--nashlo-orange))] text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50">
          {saving ? "Сохраняем…" : "Сохранить изменения"}
        </button>
      </form>
    </main>
  )
}
