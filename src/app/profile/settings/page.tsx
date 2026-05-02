"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

type ProfileForm = {
  name: string
  phone: string
  city: string
  description: string
  avatar: string
}

export default function ProfileSettingsPage() {
  const router = useRouter()
  const [form, setForm] = useState<ProfileForm>({ name: "", phone: "", city: "", description: "", avatar: "" })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  const [uploading, setUploading] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => {
        if (r.status === 401) { router.push("/login?from=/profile/settings"); return null }
        return r.json()
      })
      .then((data) => {
        if (!data) return
        const u = data.user ?? data
        setForm({
          name: u.name || "",
          phone: u.phone || "",
          city: u.city || "",
          description: u.description || "",
          avatar: u.avatar || "",
        })
      })
      .catch(() => router.push("/login?from=/profile/settings"))
      .finally(() => setLoading(false))
  }, [router])

  async function uploadAvatar(file: File) {
    setUploading(true)
    setError("")
    const fd = new FormData()
    fd.append("file", file)
    fd.append("type", "image")
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Ошибка загрузки")
      setForm((f) => ({ ...f, avatar: data.url }))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Ошибка загрузки")
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

      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Ошибка сохранения")
      setSuccess(true)
      window.dispatchEvent(new Event("nashlo-auth-change"))
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Ошибка сохранения")
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

  return (
    <main className="mx-auto max-w-2xl px-4 py-10 pb-28 lg:pb-10">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/" className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-100 text-zinc-500 hover:bg-zinc-200">←</Link>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">Настройки профиля</h1>
      </div>

      <div className="space-y-4">
        {/* Avatar section */}
        <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">
          <div className="p-6 sm:p-8">
            <h2 className="text-base font-semibold text-zinc-950">Фото профиля</h2>
            <div className="mt-5 flex items-center gap-5">
              <div className="relative shrink-0">
                {form.avatar ? (
                  <img src={form.avatar} alt="" className="h-20 w-20 rounded-full object-cover" />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-zinc-950 text-3xl font-semibold text-white">
                    {initials}
                  </div>
                )}
                {uploading && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  </div>
                )}
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploading}
                  className="rounded-2xl bg-zinc-950 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
                >
                  {uploading ? "Загружаем…" : "Загрузить фото"}
                </button>
                {form.avatar && (
                  <button type="button" onClick={() => setForm((f) => ({ ...f, avatar: "" }))}
                    className="ml-2 rounded-2xl border border-zinc-200 px-4 py-2 text-sm text-zinc-500 hover:bg-zinc-50">
                    Удалить
                  </button>
                )}
                <p className="mt-1.5 text-xs text-zinc-400">JPEG, PNG или WebP, до 5 МБ</p>
              </div>
            </div>
            <input ref={avatarInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadAvatar(f); e.target.value = "" }} />
          </div>
        </div>

        {/* Personal info */}
        <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">
          <div className="p-6 sm:p-8">
            <h2 className="text-base font-semibold text-zinc-950">Личные данные</h2>
            <p className="mt-1 text-sm text-zinc-500">Ваше имя и контакты видны покупателям в объявлениях.</p>

            <div className="mt-6 space-y-4">
              <label className="block">
                <span className="text-sm font-medium text-zinc-700">Имя</span>
                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Как вас зовут"
                  className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm outline-none transition focus:border-[hsl(var(--nashlo-orange))] focus:bg-white" />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-zinc-700">Телефон</span>
                <input value={form.phone} readOnly
                  className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-100 px-4 text-sm text-zinc-400 cursor-not-allowed" />
                <p className="mt-1 text-xs text-zinc-400">Телефон изменить нельзя</p>
              </label>

              <label className="block">
                <span className="text-sm font-medium text-zinc-700">Город</span>
                <input value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                  placeholder="Москва"
                  className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm outline-none transition focus:border-[hsl(var(--nashlo-orange))] focus:bg-white" />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-zinc-700">О себе</span>
                <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={3} maxLength={500}
                  placeholder="Коротко о себе — покупатели увидят это в вашем профиле"
                  className="mt-2 w-full resize-none rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm outline-none transition focus:border-[hsl(var(--nashlo-orange))] focus:bg-white" />
                <p className="mt-1 text-right text-xs text-zinc-400">{form.description.length}/500</p>
              </label>
            </div>

            {error && <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
            {success && <p className="mt-4 rounded-2xl bg-green-50 px-4 py-3 text-sm text-green-700">Данные сохранены ✓</p>}

            <button type="button" onClick={save} disabled={saving}
              className="mt-6 h-12 w-full rounded-2xl bg-[hsl(var(--nashlo-orange))] text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50">
              {saving ? "Сохраняем..." : "Сохранить изменения"}
            </button>
          </div>
        </div>

        {/* Danger zone */}
        <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">
          <div className="px-6 py-5 sm:px-8">
            <h2 className="text-base font-semibold text-zinc-950">Выход из аккаунта</h2>
            <p className="mt-1 text-sm text-zinc-500">Вы будете перенаправлены на главную страницу.</p>
            <button type="button" onClick={logout}
              className="mt-4 h-11 rounded-2xl border border-red-200 bg-red-50 px-5 text-sm font-semibold text-red-600 transition hover:bg-red-100">
              Выйти из аккаунта
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
