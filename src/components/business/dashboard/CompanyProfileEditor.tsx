"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { ExternalLink } from "lucide-react"
import { companyPublicPath } from "@/lib/business/get-public-company"
import { BusinessImageUpload } from "@/components/business/BusinessImageUpload"
import { CompanyCatalogEditor } from "@/components/business/dashboard/CompanyCatalogEditor"
import { CompanyDocumentsEditor } from "@/components/business/dashboard/CompanyDocumentsEditor"

type Company = {
  id: string
  name: string
  publicSlug: string | null
  logoUrl: string | null
  coverUrl: string | null
  shortDescription: string | null
  description: string | null
  industry: string | null
  city: string | null
  region: string | null
  paymentTerms: string | null
  vatType: string | null
  minOrderInfo: string | null
  companyDeliveryRegions: string[]
  websiteUrl: string | null
  isPublic: boolean
  showPhonePublicly: boolean
  showEmailPublicly: boolean
  showWebsitePublicly: boolean
  showRequisitesPublicly: boolean
  showDocumentsPublicly: boolean
  contactName: string | null
  contactPhone: string | null
  contactEmail: string | null
  profileCompleteness: number
  verificationStatus: string
}

const SAVE_TABS = ["Оформление", "О компании", "Условия", "Публичность"] as const
const VIEW_TABS = ["Каталог", "Документы"] as const

export function CompanyProfileEditor() {
  const [company, setCompany] = useState<Company | null>(null)
  const [tab, setTab] = useState<string>("Оформление")
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState("")

  useEffect(() => {
    fetch("/api/business/companies")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setCompany(data?.items?.[0] ?? null))
  }, [])

  async function save(partial: Partial<Company>) {
    if (!company) return
    setSaving(true)
    setMsg("")
    const res = await fetch(`/api/business/companies/${company.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(partial),
    })
    const data = await res.json().catch(() => ({}))
    setSaving(false)
    if (!res.ok) {
      setMsg(data.error ?? "Ошибка сохранения")
      return
    }
    setCompany(data.company)
    setMsg("Сохранено")
  }

  if (!company) return <p className="text-sm text-zinc-500">Компания не найдена.</p>

  const previewHref = companyPublicPath(company)
  const canPreview = company.isPublic && company.verificationStatus === "VERIFIED"
  const isSaveTab = (SAVE_TABS as readonly string[]).includes(tab)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-zinc-950">Профиль компании</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Публичная витрина · заполнено <strong>{company.profileCompleteness}%</strong> · отдельно от /profile
          </p>
        </div>
        {canPreview ? (
          <Link
            href={previewHref}
            target="_blank"
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-800"
          >
            Посмотреть публичный профиль
            <ExternalLink className="h-4 w-4" />
          </Link>
        ) : (
          <span className="max-w-xs text-xs text-zinc-500">
            Публикация: проверка VERIFIED, isPublic и ≥1 активное B2B-объявление
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-1">
        {[...SAVE_TABS, ...VIEW_TABS].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${
              tab === t ? "bg-zinc-950 text-white" : "bg-zinc-100 text-zinc-600"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Каталог" && <CompanyCatalogEditor companyId={company.id} />}
      {tab === "Документы" && <CompanyDocumentsEditor companyId={company.id} />}

      {isSaveTab && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 space-y-4">
          {msg && <p className="text-sm text-emerald-700">{msg}</p>}

          {tab === "Оформление" && (
            <>
              <div className="grid gap-6 sm:grid-cols-2">
                <BusinessImageUpload
                  label="Логотип"
                  value={company.logoUrl}
                  onChange={(url) => {
                    setCompany((c) => (c ? { ...c, logoUrl: url } : c))
                    void save({ logoUrl: url })
                  }}
                />
                <BusinessImageUpload
                  label="Обложка"
                  aspect="wide"
                  value={company.coverUrl}
                  onChange={(url) => {
                    setCompany((c) => (c ? { ...c, coverUrl: url } : c))
                    void save({ coverUrl: url })
                  }}
                />
              </div>
              <label className="block text-sm font-medium text-zinc-700">Краткое описание</label>
              <textarea
                rows={2}
                className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
                value={company.shortDescription ?? ""}
                onChange={(e) => setCompany((c) => (c ? { ...c, shortDescription: e.target.value } : c))}
              />
            </>
          )}

          {tab === "О компании" && (
            <>
              <label className="block text-sm font-medium text-zinc-700">Полное описание</label>
              <textarea
                rows={6}
                className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
                value={company.description ?? ""}
                onChange={(e) => setCompany((c) => (c ? { ...c, description: e.target.value } : c))}
              />
              <label className="block text-sm font-medium text-zinc-700">Сфера</label>
              <input
                className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
                value={company.industry ?? ""}
                onChange={(e) => setCompany((c) => (c ? { ...c, industry: e.target.value } : c))}
              />
            </>
          )}

          {tab === "Условия" && (
            <>
              <label className="block text-sm font-medium text-zinc-700">Минимальный заказ</label>
              <input
                className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
                value={company.minOrderInfo ?? ""}
                onChange={(e) => setCompany((c) => (c ? { ...c, minOrderInfo: e.target.value } : c))}
              />
              <label className="block text-sm font-medium text-zinc-700">Условия оплаты</label>
              <input
                className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
                value={company.paymentTerms ?? ""}
                onChange={(e) => setCompany((c) => (c ? { ...c, paymentTerms: e.target.value } : c))}
              />
              <label className="block text-sm font-medium text-zinc-700">НДС</label>
              <input
                className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
                value={company.vatType ?? ""}
                onChange={(e) => setCompany((c) => (c ? { ...c, vatType: e.target.value } : c))}
              />
              <label className="block text-sm font-medium text-zinc-700">Регионы поставки</label>
              <input
                className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
                value={company.companyDeliveryRegions.join(", ")}
                onChange={(e) =>
                  setCompany((c) =>
                    c
                      ? {
                          ...c,
                          companyDeliveryRegions: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                        }
                      : c,
                  )
                }
              />
            </>
          )}

          {tab === "Публичность" && (
            <div className="space-y-3 text-sm">
              {(
                [
                  ["isPublic", "Публичный профиль компании"],
                  ["showPhonePublicly", "Показывать телефон"],
                  ["showEmailPublicly", "Показывать email"],
                  ["showWebsitePublicly", "Показывать сайт"],
                  ["showRequisitesPublicly", "Показывать реквизиты (ИНН/ОГРН)"],
                  ["showDocumentsPublicly", "Показывать документы на витрине"],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={Boolean(company[key])}
                    onChange={(e) => setCompany((c) => (c ? { ...c, [key]: e.target.checked } : c))}
                  />
                  {label}
                </label>
              ))}
            </div>
          )}

          <button
            type="button"
            disabled={saving}
            onClick={() => void save(company)}
            className="rounded-xl bg-[hsl(var(--nashlo-orange))] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? "Сохранение…" : "Сохранить"}
          </button>
        </div>
      )}
    </div>
  )
}
