"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { COMPANY_TYPE_OPTIONS, BUSINESS_ROLE_OPTIONS } from "@/lib/business/config"

const STEPS = ["Тип бизнеса", "Компания", "Контакты", "Проверка"] as const

const QUICK_TYPE_CHIPS = [
  { kind: "companyType" as const, value: "IP", label: "ИП" },
  { kind: "companyType" as const, value: "LLC", label: "ООО" },
  { kind: "companyType" as const, value: "SELF_EMPLOYED", label: "Самозанятый" },
  { kind: "businessRole" as const, value: "SUPPLIER", label: "Поставщик" },
  { kind: "businessRole" as const, value: "BUYER", label: "Закупщик" },
  { kind: "businessRole" as const, value: "MANUFACTURER", label: "Производитель" },
]

type FormState = {
  name: string
  inn: string
  ogrn: string
  companyType: string
  businessRole: string
  region: string
  city: string
  industry: string
  websiteUrl: string
  contactName: string
  contactRole: string
  contactEmail: string
  description: string
}

const initial: FormState = {
  name: "",
  inn: "",
  ogrn: "",
  companyType: "LLC",
  businessRole: "SUPPLIER",
  region: "",
  city: "",
  industry: "",
  websiteUrl: "",
  contactName: "",
  contactRole: "",
  contactEmail: "",
  description: "",
}

export function BusinessRegisterWizard() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [done, setDone] = useState(false)
  const [form, setForm] = useState<FormState>(initial)

  useEffect(() => {
    fetch("/api/auth/me").then((r) => {
      if (!r.ok) router.replace("/business/login?from=/business/register")
    })
  }, [router])

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function submit() {
    setError("")
    setLoading(true)
    const res = await fetch("/api/business/companies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    const data = await res.json().catch(() => ({}))
    setLoading(false)
    if (!res.ok) {
      setError(data.error ?? "Ошибка регистрации")
      return
    }
    setDone(true)
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-8 text-center">
        <h2 className="text-lg font-semibold text-zinc-950">Профиль отправлен на проверку</h2>
        <p className="mt-3 text-sm text-zinc-600">
          Бизнес-профиль создан и отправлен на проверку. После проверки компания сможет получить отметку
          доверия.
        </p>
        <Link
          href="/business/dashboard"
          className="mt-6 inline-block rounded-xl bg-[hsl(var(--nashlo-orange))] px-5 py-2.5 text-sm font-semibold text-white"
        >
          Перейти в кабинет
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-zinc-950">Регистрация бизнеса</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Подключите компанию к аккаунту Нашло. До верификации — до 3 B2B-объявлений.
      </p>

      <div className="mt-6 flex gap-1 overflow-x-auto pb-1">
        {STEPS.map((label, i) => (
          <div
            key={label}
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
              i === step ? "bg-zinc-950 text-white" : i < step ? "bg-zinc-200 text-zinc-700" : "bg-zinc-100 text-zinc-400"
            }`}
          >
            {i + 1}. {label}
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6">
        {error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}

        {step === 0 && (
          <div className="space-y-4">
            <p className="text-sm text-zinc-600">Выберите тип организации и роль на площадке.</p>
            <label>
              <span className="text-sm font-medium text-zinc-700">Тип организации</span>
              <select
                className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2"
                value={form.companyType}
                onChange={(e) => set("companyType", e.target.value)}
              >
                {COMPANY_TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="text-sm font-medium text-zinc-700">Роль на площадке</span>
              <select
                className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2"
                value={form.businessRole}
                onChange={(e) => set("businessRole", e.target.value)}
              >
                {BUSINESS_ROLE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex flex-wrap gap-2">
              {QUICK_TYPE_CHIPS.map((h) => (
                <button
                  key={`${h.kind}-${h.value}`}
                  type="button"
                  onClick={() => set(h.kind, h.value)}
                  className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
                >
                  {h.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="sm:col-span-2">
              <span className="text-sm font-medium text-zinc-700">Название компании *</span>
              <input
                required
                className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
              />
            </label>
            <label>
              <span className="text-sm font-medium text-zinc-700">ИНН *</span>
              <input
                required
                className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2"
                value={form.inn}
                onChange={(e) => set("inn", e.target.value)}
              />
            </label>
            <label>
              <span className="text-sm font-medium text-zinc-700">ОГРН / ОГРНИП</span>
              <input
                className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2"
                value={form.ogrn}
                onChange={(e) => set("ogrn", e.target.value)}
              />
            </label>
            <label>
              <span className="text-sm font-medium text-zinc-700">Регион</span>
              <input
                className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2"
                value={form.region}
                onChange={(e) => set("region", e.target.value)}
              />
            </label>
            <label>
              <span className="text-sm font-medium text-zinc-700">Город *</span>
              <input
                required
                className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2"
                value={form.city}
                onChange={(e) => set("city", e.target.value)}
              />
            </label>
            <label className="sm:col-span-2">
              <span className="text-sm font-medium text-zinc-700">Сфера деятельности</span>
              <input
                className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2"
                value={form.industry}
                onChange={(e) => set("industry", e.target.value)}
              />
            </label>
            <label className="sm:col-span-2">
              <span className="text-sm font-medium text-zinc-700">Сайт</span>
              <input
                type="url"
                className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2"
                value={form.websiteUrl}
                onChange={(e) => set("websiteUrl", e.target.value)}
                placeholder="https://"
              />
            </label>
          </div>
        )}

        {step === 2 && (
          <div className="grid gap-4 sm:grid-cols-2">
            <label>
              <span className="text-sm font-medium text-zinc-700">Имя контактного лица *</span>
              <input
                required
                className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2"
                value={form.contactName}
                onChange={(e) => set("contactName", e.target.value)}
              />
            </label>
            <label>
              <span className="text-sm font-medium text-zinc-700">Должность</span>
              <input
                className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2"
                value={form.contactRole}
                onChange={(e) => set("contactRole", e.target.value)}
              />
            </label>
            <label className="sm:col-span-2">
              <span className="text-sm font-medium text-zinc-700">Email</span>
              <input
                type="email"
                className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2"
                value={form.contactEmail}
                onChange={(e) => set("contactEmail", e.target.value)}
              />
            </label>
            <p className="sm:col-span-2 text-xs text-zinc-500">
              Телефон подтверждается через ваш аккаунт Нашло при входе.
            </p>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3 text-sm text-zinc-700">
            <p className="font-semibold text-zinc-950">Проверьте данные перед отправкой</p>
            <p>
              <span className="text-zinc-500">Компания:</span> {form.name}
            </p>
            <p>
              <span className="text-zinc-500">ИНН:</span> {form.inn}
            </p>
            <p>
              <span className="text-zinc-500">Город:</span> {form.city}
            </p>
            <p>
              <span className="text-zinc-500">Контакт:</span> {form.contactName}
              {form.contactRole ? `, ${form.contactRole}` : ""}
            </p>
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
              После отправки статус компании будет <strong>PENDING_REVIEW</strong>. Модератор проверит
              реквизиты; автоматическая верификация не выполняется.
            </p>
            <p className="text-xs text-zinc-500">
              Регистрируя компанию, вы соглашаетесь с{" "}
              <Link href="/legal/business-terms" className="underline">
                условиями Нашло Бизнес
              </Link>
              .
            </p>
          </div>
        )}

        <div className="mt-6 flex gap-3">
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-700"
            >
              Назад
            </button>
          )}
          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              disabled={step === 1 && (!form.name || !form.inn || !form.city)}
              className="ml-auto rounded-xl bg-zinc-950 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              Далее
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void submit()}
              disabled={loading}
              className="ml-auto rounded-xl bg-[hsl(var(--nashlo-orange))] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {loading ? "Отправка…" : "Отправить на проверку"}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
