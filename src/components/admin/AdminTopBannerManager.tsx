"use client"

import { useEffect, useState } from "react"
import { imageFileToCompressedDataUrl } from "@/lib/image-compression"
import { getAdminCsrfFromDocument } from "@/lib/admin/csrf-client"
import { AD_DISCLOSURE_MARK_OPTIONS, DISCLOSURE_MARK_LABEL, type AdDisclosureMark } from "@/lib/ads/disclosure-mark"

type SiteBanner = {
  id?: string
  title: string
  linkText: string
  href: string
  image: string
  imageOnly: boolean
  bgFrom: string
  bgTo: string
  active: boolean
  disclosureMark: AdDisclosureMark
  startsAt: string
  endsAt: string
}

const emptyBanner: SiteBanner = {
  title: "",
  linkText: "",
  href: "/advertising",
  image: "",
  imageOnly: false,
  bgFrom: "#ffffff",
  bgTo: "#ffffff",
  active: false,
  disclosureMark: "ad",
  startsAt: "",
  endsAt: "",
}

function toInputDate(value?: string | null) {
  return value ? new Date(value).toISOString().slice(0, 10) : ""
}

export function AdminTopBannerManager() {
  const [banners, setBanners] = useState<SiteBanner[]>([])
  const [draft, setDraft] = useState<SiteBanner>(emptyBanner)
  const [message, setMessage] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const res = await fetch("/api/admin/site-banner")
    if (!res.ok) return
    const data = await res.json()
    setBanners((data.banners ?? []).map((item: SiteBanner) => ({
      ...item,
      linkText: item.linkText || "",
      image: item.image || "",
      imageOnly: Boolean(item.imageOnly),
      disclosureMark: (item.disclosureMark as AdDisclosureMark) || "ad",
      startsAt: toInputDate(item.startsAt),
      endsAt: toInputDate(item.endsAt),
    })))
  }

  function update<K extends keyof SiteBanner>(key: K, value: SiteBanner[K]) {
    setDraft((current) => ({ ...current, [key]: value }))
    setMessage("")
  }

  const isEditing = Boolean(draft.id && banners.some((b) => b.id === draft.id))

  function edit(item: SiteBanner) {
    setDraft(item)
    setMessage("")
    requestAnimationFrame(() => {
      document.getElementById("site-strip-editor")?.scrollIntoView({ behavior: "smooth", block: "start" })
    })
  }

  function cancelEdit() {
    setDraft(emptyBanner)
    setMessage("")
  }

  async function handleImage(file: File | undefined) {
    if (!file) return
    if (!file.type.startsWith("image/")) {
      setMessage("Загрузите картинку в формате JPEG, PNG или WebP.")
      return
    }
    try {
      const dataUrl = await imageFileToCompressedDataUrl(file, {
        maxWidth: 2880,
        maxHeight: 112,
        quality: 0.92,
        mimeType: "image/webp",
      })
      update("image", dataUrl)
      update("imageOnly", true)
      setMessage("Картинка загружена. Рекомендуем режим «баннер-картинка».")
    } catch {
      setMessage("Не удалось подготовить изображение.")
    }
  }

  function removeImage() {
    update("image", "")
    update("imageOnly", false)
  }

  async function save() {
    if (!draft.href?.trim()) {
      setMessage("Укажите ссылку.")
      return
    }
    if (!draft.imageOnly && !draft.title?.trim()) {
      setMessage("Укажите текст или включите «баннер-картинка» с загруженным файлом.")
      return
    }
    if (draft.imageOnly && !draft.image?.trim()) {
      setMessage("Для режима «баннер-картинка» загрузите изображение.")
      return
    }

    setSaving(true)
    setMessage("")
    const res = await fetch("/api/admin/site-banner", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": getAdminCsrfFromDocument(),
      },
      body: JSON.stringify(draft),
    })
    const data = await res.json().catch(() => ({}))
    setSaving(false)
    if (!res.ok) {
      setMessage(data.error || "Не удалось сохранить баннер")
      return
    }
    setMessage(isEditing ? "Баннер обновлён." : "Верхний баннер сохранён.")
    if (!isEditing) setDraft(emptyBanner)
    await load()
  }

  return (
    <section
      id="site-strip-editor"
      className={[
        "scroll-mt-24 rounded-[28px] border bg-white p-5 shadow-sm",
        isEditing ? "border-[hsl(var(--nashlo-orange))] ring-2 ring-[hsl(var(--nashlo-orange)/0.15)]" : "border-zinc-200",
      ].join(" ")}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-[hsl(var(--nashlo-orange))]">Баннер площадки</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-950">Полоса над шапкой</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Текстовая полоса или <strong className="font-medium text-zinc-700">широкий баннер-картинка</strong> на всех
            страницах (кроме админки и бизнеса). Размер файла: ~1200×48 px (лучше 2400×96).
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isEditing ? (
            <button type="button" onClick={cancelEdit} className="rounded-2xl border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-600">
              Отмена
            </button>
          ) : null}
          <button type="button" onClick={() => setDraft(emptyBanner)} className="w-fit rounded-2xl bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-700">
            Новый баннер
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-3">
          <div className="rounded-2xl border border-zinc-100 bg-zinc-50/80 p-3">
            <label className="flex items-center gap-2 text-sm font-medium text-zinc-700">
              <input
                type="checkbox"
                checked={draft.imageOnly}
                disabled={!draft.image?.trim()}
                onChange={(event) => update("imageOnly", event.target.checked)}
                className="h-4 w-4 accent-[hsl(var(--nashlo-orange))]"
              />
              Баннер-картинка на всю полосу (без текста)
            </label>
          </div>

          <label className="block">
            <span className="text-sm font-medium text-zinc-600">Ссылка *</span>
            <input
              value={draft.href}
              onChange={(event) => update("href", event.target.value)}
              placeholder="/advertising или https://..."
              className="mt-1 h-12 w-full rounded-2xl border border-zinc-200 px-4 text-sm outline-none focus:border-[hsl(var(--nashlo-orange))]"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-zinc-600">Картинка (1200×48, лучше 2400×96)</span>
            <input
              type="file"
              accept="image/*"
              onChange={(event) => handleImage(event.target.files?.[0])}
              className="mt-1 block w-full text-sm text-zinc-500 file:mr-3 file:rounded-xl file:border-0 file:bg-zinc-950 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
            />
            {draft.image ? (
              <div className="mt-2 flex items-center gap-2">
                <img src={draft.image} alt="" className="h-10 max-w-full rounded-lg border object-cover" />
                <button type="button" onClick={removeImage} className="text-xs font-semibold text-red-600 hover:underline">
                  Удалить
                </button>
              </div>
            ) : null}
          </label>

          {!draft.imageOnly ? (
            <>
              <input
                value={draft.title}
                onChange={(event) => update("title", event.target.value)}
                placeholder="Текст баннера"
                className="h-12 w-full rounded-2xl border border-zinc-200 px-4 text-sm outline-none focus:border-[hsl(var(--nashlo-orange))]"
              />
              <input
                value={draft.linkText}
                onChange={(event) => update("linkText", event.target.value)}
                placeholder="Текст ссылки (необязательно)"
                className="h-12 w-full rounded-2xl border border-zinc-200 px-4 text-sm outline-none focus:border-[hsl(var(--nashlo-orange))]"
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-xs text-zinc-500">Фон слева</span>
                  <input type="color" value={draft.bgFrom} onChange={(event) => update("bgFrom", event.target.value)} className="mt-1 h-12 w-full rounded-2xl border border-zinc-200 bg-white px-2" />
                </div>
                <div>
                  <span className="text-xs text-zinc-500">Фон справа</span>
                  <input type="color" value={draft.bgTo} onChange={(event) => update("bgTo", event.target.value)} className="mt-1 h-12 w-full rounded-2xl border border-zinc-200 bg-white px-2" />
                </div>
              </div>
            </>
          ) : (
            <input
              value={draft.title}
              onChange={(event) => update("title", event.target.value)}
              placeholder="Подпись для доступности (необязательно)"
              className="h-12 w-full rounded-2xl border border-zinc-200 px-4 text-sm outline-none focus:border-[hsl(var(--nashlo-orange))]"
            />
          )}

          <div className="grid grid-cols-2 gap-3">
            <input type="date" value={draft.startsAt} onChange={(event) => update("startsAt", event.target.value)} className="h-12 w-full rounded-2xl border border-zinc-200 px-4 text-sm outline-none" />
            <input type="date" value={draft.endsAt} onChange={(event) => update("endsAt", event.target.value)} className="h-12 w-full rounded-2xl border border-zinc-200 px-4 text-sm outline-none" />
          </div>

          {/* Disclosure mark selector */}
          <div className="rounded-2xl border border-zinc-100 bg-zinc-50/80 p-3">
            <p className="mb-2 text-sm font-medium text-zinc-700">Маркировка (обязательно по ФЗ)</p>
            <div className="grid grid-cols-2 gap-2">
              {AD_DISCLOSURE_MARK_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => update("disclosureMark", opt.value)}
                  className={[
                    "rounded-xl border px-3 py-2 text-left text-sm font-semibold transition-colors",
                    draft.disclosureMark === opt.value
                      ? "border-[hsl(var(--nashlo-orange))] bg-orange-50 text-[hsl(var(--nashlo-orange))]"
                      : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300",
                  ].join(" ")}
                >
                  <span className="block">{opt.label}</span>
                  <span className="mt-0.5 block text-xs font-normal text-zinc-400">{opt.description}</span>
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-3 rounded-2xl bg-zinc-50 p-3">
            <input type="checkbox" checked={draft.active} onChange={(event) => update("active", event.target.checked)} className="h-4 w-4 accent-[hsl(var(--nashlo-orange))]" />
            <span className="text-sm font-semibold text-zinc-700">Показывать над шапкой</span>
          </label>

          {message && <p className="rounded-2xl bg-orange-50 px-4 py-3 text-sm font-semibold text-[hsl(var(--nashlo-orange))]">{message}</p>}

          <button type="button" onClick={save} disabled={saving} className="w-full rounded-2xl bg-[hsl(var(--nashlo-orange))] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">
            {saving ? "Сохраняем..." : isEditing ? "Сохранить изменения" : "Сохранить баннер"}
          </button>
        </div>

        <div className="space-y-4">
          <p className="text-sm font-semibold text-zinc-950">Превью на сайте</p>
          <div className="overflow-hidden rounded-2xl border border-zinc-200">
            {draft.imageOnly && draft.image ? (
              <div className="relative">
                <img src={draft.image} alt="" className="block h-11 w-full object-cover sm:h-12" />
                <span className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-semibold text-white">
                  {DISCLOSURE_MARK_LABEL[draft.disclosureMark]}
                </span>
                <span className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 px-2 py-0.5 text-xs text-white">
                  x
                </span>
              </div>
            ) : (
              <div
                className="relative flex min-h-11 items-center justify-center px-10 text-center sm:min-h-12"
                style={{ background: `linear-gradient(90deg, ${draft.bgFrom}, ${draft.bgTo})` }}
              >
                <span className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/20 px-2 py-0.5 text-[10px] font-semibold text-zinc-900/70">
                  {DISCLOSURE_MARK_LABEL[draft.disclosureMark]}
                </span>
                <p className="line-clamp-1 text-sm font-semibold text-zinc-950">
                  {draft.title || "Текст баннера"}{" "}
                  {draft.linkText ? <span className="underline underline-offset-4">{draft.linkText}</span> : null}
                </p>
                {draft.image ? (
                  <img src={draft.image} alt="" className="pointer-events-none absolute inset-y-0 right-0 w-1/3 object-cover object-right opacity-80" />
                ) : null}
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-lg text-zinc-500">x</span>
              </div>
            )}
          </div>

          <div className="rounded-3xl bg-zinc-50 p-4">
            <p className="text-sm font-semibold text-zinc-950">Сохранённые баннеры</p>
            <div className="mt-3 space-y-2">
              {banners.length ? (
                banners.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => edit(item)}
                    className={[
                      "flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left text-sm shadow-sm",
                      draft.id === item.id ? "bg-orange-50 ring-1 ring-[hsl(var(--nashlo-orange)/0.3)]" : "bg-white",
                    ].join(" ")}
                  >
                    <span className="min-w-0 truncate font-semibold text-zinc-800">
                      {item.imageOnly ? "img " : ""}
                      {item.title || "Баннер-картинка"}
                    </span>
                    <span className="flex shrink-0 items-center gap-1.5">
                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-500">
                        {DISCLOSURE_MARK_LABEL[item.disclosureMark] ?? "Реклама"}
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${item.active ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-400"}`}>
                        {item.active ? "Активен" : "Выкл"}
                      </span>
                    </span>
                  </button>
                ))
              ) : (
                <p className="text-sm text-zinc-400">Пока нет баннеров.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
