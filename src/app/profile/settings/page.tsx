"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

type ProfileForm = {
  name: string
  phone: string
  city: string
}

export default function ProfileSettingsPage() {
  const router = useRouter()
  const [form, setForm] = useState<ProfileForm>({ name: "", phone: "", city: "" })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    async function load() {
      try {
        const { getSupabase } = await import("@/lib/supabase")
        const supabase = getSupabase()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push("/login?from=/profile/settings"); return }

        const { data } = await supabase
          .from("profiles")
          .select("name,phone,city")
          .eq("id", user.id)
          .single()

        if (data) {
          setForm({
            name: data.name || "",
            phone: data.phone || "",
            city: data.city || "",
          })
        }
      } catch {
        // Supabase not configured — use localStorage fallback
        const stored = window.localStorage.getItem("nashlo-demo-user")
        if (stored) {
          const u = JSON.parse(stored)
          setForm({ name: u.name || "", phone: u.phone || "", city: u.city || "" })
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [router])

  async function save() {
    setSaving(true)
    setError("")
    setSuccess(false)

    try {
      const { getSupabase } = await import("@/lib/supabase")
      const supabase = getSupabase()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { error: dbError } = await supabase
          .from("profiles")
          .upsert({ id: user.id, ...form, updated_at: new Date().toISOString() })
        if (dbError) throw dbError
      } else {
        // Demo fallback
        window.localStorage.setItem("nashlo-demo-user", JSON.stringify(form))
        window.dispatchEvent(new Event("nashlo-auth-change"))
      }

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Ошибка сохранения")
    } finally {
      setSaving(false)
    }
  }

  async function logout() {
    try {
      const { getSupabase } = await import("@/lib/supabase")
      await getSupabase().auth.signOut()
    } catch {}
    window.localStorage.removeItem("nashlo-demo-user")
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

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/" className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-100 text-zinc-500 hover:bg-zinc-200">
          ←
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">Настройки профиля</h1>
      </div>

      <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">
        <div className="p-6 sm:p-8">
          <h2 className="text-base font-semibold text-zinc-950">Личные данные</h2>
          <p className="mt-1 text-sm text-zinc-500">Ваше имя и контакты видны покупателям в объявлениях.</p>

          <div className="mt-6 space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-zinc-700">Имя</span>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Как вас зовут"
                className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm outline-none transition focus:border-[hsl(var(--nashlo-orange))] focus:bg-white"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-zinc-700">Телефон</span>
              <input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="+7 (999) 000-00-00"
                type="tel"
                className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm outline-none transition focus:border-[hsl(var(--nashlo-orange))] focus:bg-white"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-zinc-700">Город</span>
              <input
                value={form.city}
                onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                placeholder="Москва"
                className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm outline-none transition focus:border-[hsl(var(--nashlo-orange))] focus:bg-white"
              />
            </label>
          </div>

          {error && (
            <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
          )}
          {success && (
            <p className="mt-4 rounded-2xl bg-green-50 px-4 py-3 text-sm text-green-700">Данные сохранены ✓</p>
          )}

          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="mt-6 h-12 w-full rounded-2xl bg-[hsl(var(--nashlo-orange))] text-sm font-semibold text-white transition hover:bg-[hsl(var(--nashlo-orange)/0.9)] disabled:opacity-50"
          >
            {saving ? "Сохраняем..." : "Сохранить изменения"}
          </button>
        </div>

        <div className="border-t border-zinc-100 px-6 py-5 sm:px-8">
          <h2 className="text-base font-semibold text-zinc-950">Выход из аккаунта</h2>
          <p className="mt-1 text-sm text-zinc-500">Вы будете перенаправлены на главную страницу.</p>
          <button
            type="button"
            onClick={logout}
            className="mt-4 h-11 rounded-2xl border border-red-200 bg-red-50 px-5 text-sm font-semibold text-red-600 transition hover:bg-red-100"
          >
            Выйти из аккаунта
          </button>
        </div>
      </div>
    </main>
  )
}
