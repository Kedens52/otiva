"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"

type ProfileForm = {
  name: string
  phone: string
  email: string
  city: string
  description: string
  avatar: string
}

type AuthProviders = {
  phone: boolean
  vk: boolean
  yandex: boolean
}

const providerNames: Record<keyof AuthProviders, string> = {
  phone: "Телефон",
  vk: "VK",
  yandex: "Яндекс",
}

export default function ProfileSettingsPage() {
  const router = useRouter()
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState<ProfileForm>({ name: "", phone: "", email: "", city: "", description: "", avatar: "" })
  const [providers, setProviders] = useState<AuthProviders>({ phone: false, vk: false, yandex: false })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    fetch("/api/auth/me")
      .then((response) => {
        if (response.status === 401) {
          router.push("/login?from=/profile/settings")
          return null
        }
        return response.json()
      })
      .then((data) => {
        if (!data) return
        const user = data.user ?? data
        setForm({
          name: user.name || "",
          phone: user.phone || "",
          email: user.email || "",
          city: user.city || "",
          description: user.description || "",
          avatar: user.avatar || "",
        })
        setProviders(user.authProviders ?? {
          phone: Boolean(user.phone),
          vk: Boolean(user.vkId),
          yandex: Boolean(user.yandexId),
        })
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
      setForm((current) => ({ ...current, avatar: data.url }))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось загрузить фото")
    } finally {
      setUploading(false)
    }
  }

  async function save() {
    setSaving(true)
    setError("")
    setSuccess(false)

    try {
      const payload: Record<string, string> = {}
      if (form.name.trim()) payload.name = form.name.trim()
      if (form.city.trim()) payload.city = form.city.trim()
      if (form.description.trim()) payload.description = form.description.trim()
      if (form.avatar) payload.avatar = form.avatar

      const response = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Не удалось сохранить профиль")

      setSuccess(true)
      window.dispatchEvent(new Event("nashlo-auth-change"))
      setTimeout(() => setSuccess(false), 2500)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось сохранить профиль")
    } finally {
      setSaving(false)
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" })
    window.dispatchEvent(new Event("nashlo-auth-change"))
    router.push("/")
  }

  if (loading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-950" />
      </main>
    )
  }

  const initials = (form.name || "П")[0].toUpperCase()
  const filled = [form.name, form.city, form.description, form.avatar].filter(Boolean).length
  const progress = Math.round((filled / 4) * 100)

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 pb-28 lg:py-10 lg:pb-12">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/profile" className="flex h-10 w-10 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-600 hover:bg-zinc-200">
            ←
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-950 lg:text-4xl">Управление профилем</h1>
            <p className="mt-1 text-sm text-zinc-500">Эти данные помогают покупателям понимать, с кем они общаются.</p>
          </div>
        </div>
        <Link href="/profile" className="hidden rounded-2xl border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 sm:inline-flex">
          В кабинет
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="space-y-4 lg:sticky lg:top-24 lg:h-fit">
          <section className="rounded-[32px] border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                {form.avatar ? (
                  <img src={form.avatar} alt="" className="h-24 w-24 rounded-full object-cover" />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-zinc-950 text-3xl font-semibold text-white">
                    {initials}
                  </div>
                )}
                {uploading && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/45">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-xl font-bold text-zinc-950">{form.name || "Профиль без имени"}</p>
                <p className="mt-1 text-sm text-zinc-500">{form.city || "Город не указан"}</p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl bg-zinc-50 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-zinc-950">Заполнение</p>
                <p className="text-sm font-bold text-[hsl(var(--nashlo-orange))]">{progress}%</p>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
                <div className="h-full rounded-full bg-[hsl(var(--nashlo-orange))]" style={{ width: `${progress}%` }} />
              </div>
            </div>

            <div className="mt-4 grid gap-2">
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={uploading}
                className="rounded-2xl bg-zinc-950 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                {uploading ? "Загружаем..." : "Загрузить фото"}
              </button>
              {form.avatar && (
                <button
                  type="button"
                  onClick={() => setForm((current) => ({ ...current, avatar: "" }))}
                  className="rounded-2xl border border-zinc-200 px-4 py-3 text-sm font-semibold text-zinc-600 hover:bg-zinc-50"
                >
                  Удалить фото
                </button>
              )}
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (file) uploadAvatar(file)
                  event.target.value = ""
                }}
              />
            </div>
            <p className="mt-3 text-xs leading-5 text-zinc-400">JPEG, PNG или WebP до 5 МБ. Лучше квадратное фото без мелкого текста.</p>
          </section>

          <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-bold text-zinc-950">Синхронизация входа</h2>
            <div className="mt-4 space-y-2">
              {(Object.keys(providerNames) as Array<keyof AuthProviders>).map((key) => (
                <div key={key} className="flex items-center justify-between rounded-2xl bg-zinc-50 px-4 py-3">
                  <span className="text-sm font-semibold text-zinc-800">{providerNames[key]}</span>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${providers[key] ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-400"}`}>
                    {providers[key] ? "Подключен" : "Не подключен"}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs leading-5 text-zinc-500">
              Если почта или телефон совпадают, вход через разные способы будет попадать в этот же профиль.
            </p>
          </section>
        </aside>

        <section className="space-y-4">
          <div className="rounded-[32px] border border-zinc-200 bg-white p-5 shadow-sm sm:p-7">
            <h2 className="text-xl font-bold text-zinc-950">Основные данные</h2>
            <p className="mt-1 text-sm text-zinc-500">Имя, город и описание видны в публичном профиле и в объявлениях.</p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-semibold text-zinc-700">Имя</span>
                <input
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Как вас зовут"
                  className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm outline-none transition focus:border-[hsl(var(--nashlo-orange))] focus:bg-white"
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-zinc-700">Город</span>
                <input
                  value={form.city}
                  onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))}
                  placeholder="Например, Москва"
                  className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm outline-none transition focus:border-[hsl(var(--nashlo-orange))] focus:bg-white"
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-zinc-700">Телефон</span>
                <input
                  value={form.phone || "Не подключен"}
                  readOnly
                  className="mt-2 h-12 w-full cursor-not-allowed rounded-2xl border border-zinc-200 bg-zinc-100 px-4 text-sm text-zinc-500"
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-zinc-700">Почта</span>
                <input
                  value={form.email || "Не подключена"}
                  readOnly
                  className="mt-2 h-12 w-full cursor-not-allowed rounded-2xl border border-zinc-200 bg-zinc-100 px-4 text-sm text-zinc-500"
                />
              </label>
            </div>

            <label className="mt-4 block">
              <span className="text-sm font-semibold text-zinc-700">О себе</span>
              <textarea
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                rows={5}
                maxLength={500}
                placeholder="Коротко расскажите о себе: чем занимаетесь, как быстро отвечаете, в каком городе встречаетесь."
                className="mt-2 w-full resize-none rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm leading-6 outline-none transition focus:border-[hsl(var(--nashlo-orange))] focus:bg-white"
              />
              <span className="mt-1 block text-right text-xs text-zinc-400">{form.description.length}/500</span>
            </label>

            {error && <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
            {success && <p className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">Профиль сохранен</p>}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="h-12 rounded-2xl bg-[hsl(var(--nashlo-orange))] px-6 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50 sm:w-fit"
              >
                {saving ? "Сохраняем..." : "Сохранить изменения"}
              </button>
              <Link href="/profile" className="flex h-12 items-center justify-center rounded-2xl border border-zinc-200 px-6 text-sm font-semibold text-zinc-700 hover:bg-zinc-50">
                Отмена
              </Link>
            </div>
          </div>

          <div className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm sm:p-7">
            <h2 className="text-xl font-bold text-zinc-950">Безопасность</h2>
            <p className="mt-1 text-sm text-zinc-500">Выход завершит текущую сессию на этом устройстве.</p>
            <button
              type="button"
              onClick={logout}
              className="mt-5 h-11 rounded-2xl border border-red-200 bg-red-50 px-5 text-sm font-semibold text-red-600 transition hover:bg-red-100"
            >
              Выйти из аккаунта
            </button>
          </div>
        </section>
      </div>
    </main>
  )
}
