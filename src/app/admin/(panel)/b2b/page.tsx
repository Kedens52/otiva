"use client"

import Link from "next/link"
import Image from "next/image"
import { useEffect, useState } from "react"
import { getAdminCsrfFromDocument } from "@/lib/admin/csrf-client"
import { formatPrice } from "@/lib/listing-types"
import { companyPublicPath } from "@/lib/business/get-public-company"
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader"
import { AdminPageShell } from "@/components/admin/layout/AdminPageShell"
import { AdminStatusBadge } from "@/components/admin/ui/AdminStatusBadge"

type RiskFlag = { id: string; label: string; severity: string }

type Company = {
  id: string
  name: string
  inn: string | null
  city: string | null
  verificationStatus: string
  logoUrl: string | null
  publicSlug: string | null
  profileCompleteness: number
  isPublic?: boolean
  createdAt: string
  riskFlags?: RiskFlag[]
  publicPath?: string
  _count?: { listings: number }
}

type Listing = {
  id: string
  title: string
  price: number
  status: string
  company: { name: string; inn: string | null }
}

type Inquiry = {
  id: string
  type: string
  contactName: string | null
  contactPhone: string | null
  status: string
  createdAt: string
  toCompany: { name: string }
}

type Report = {
  id: string
  reason: string
  comment: string
  createdAt: string
  company: { id: string; name: string } | null
}

const TABS = ["companies", "listings", "inquiries", "profiles", "reports"] as const

export default function AdminB2bPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("companies")
  const [companies, setCompanies] = useState<Company[]>([])
  const [listings, setListings] = useState<Listing[]>([])
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [profiles, setProfiles] = useState<Company[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    const res = await fetch(`/api/admin/b2b?tab=${tab}`)
    if (res.ok) {
      const data = await res.json()
      if (tab === "companies") setCompanies(data.items ?? [])
      else if (tab === "listings") setListings(data.items ?? [])
      else if (tab === "inquiries") setInquiries(data.items ?? [])
      else if (tab === "profiles") setProfiles(data.items ?? [])
      else setReports(data.items ?? [])
    }
    setLoading(false)
  }

  useEffect(() => {
    void load()
  }, [tab])

  async function moderate(
    entity: "company" | "listing" | "inquiry",
    id: string,
    action: string,
  ) {
    await fetch("/api/admin/b2b", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": getAdminCsrfFromDocument(),
      },
      body: JSON.stringify({ entity, id, action }),
    })
    void load()
  }

  return (
    <AdminPageShell>
      <AdminPageHeader
        title="Нашло Бизнес"
        description="B2B: компании, витрины, объявления, запросы прайса, жалобы"
      />
      <div className="mt-6 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-xl px-3 py-2 text-sm font-semibold ${tab === t ? "bg-zinc-950 text-white" : "bg-zinc-100"}`}
          >
            {t === "companies" && "На проверке"}
            {t === "listings" && "B2B-объявления"}
            {t === "inquiries" && "Запросы прайса"}
            {t === "profiles" && "Публичные профили"}
            {t === "reports" && "Жалобы"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="mt-8 py-12 text-center text-sm text-zinc-400">Загрузка…</div>
      ) : tab === "companies" ? (
        <ul className="mt-6 overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-sm divide-y divide-zinc-100">
          {companies.length === 0 ? (
            <li className="px-5 py-12 text-center text-sm text-zinc-400">Нет компаний на проверке</li>
          ) : companies.map((c) => (
            <li key={c.id} className="px-4 py-4 sm:px-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex gap-3">
                  {c.logoUrl && (
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-zinc-100">
                      <Image src={c.logoUrl} alt="" fill className="object-cover" sizes="48px" />
                    </div>
                  )}
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-zinc-950">{c.name}</p>
                      <AdminStatusBadge variant="b2b" status={c.verificationStatus} />
                    </div>
                    <p className="text-sm text-zinc-500">
                      ИНН {c.inn} · {c.city} · заполнено {c.profileCompleteness}%
                    </p>
                    {c.riskFlags && c.riskFlags.length > 0 && (
                      <ul className="mt-2 flex flex-wrap gap-1">
                        {c.riskFlags.map((f) => (
                          <li
                            key={f.id}
                            className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                              f.severity === "high"
                                ? "bg-red-100 text-red-800"
                                : f.severity === "medium"
                                  ? "bg-amber-100 text-amber-900"
                                  : "bg-zinc-100 text-zinc-600"
                            }`}
                          >
                            {f.label}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {c.publicPath && (
                    <Link href={c.publicPath} target="_blank" className="rounded-lg border px-3 py-1.5 text-xs font-semibold">
                      Витрина
                    </Link>
                  )}
                  <button type="button" onClick={() => moderate("company", c.id, "APPROVE")} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white">
                    Проверено
                  </button>
                  <button type="button" onClick={() => moderate("company", c.id, "REJECT")} className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700">
                    Отклонить
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : tab === "profiles" ? (
        <ul className="mt-6 overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-sm divide-y divide-zinc-100">
          {profiles.length === 0 ? (
            <li className="px-5 py-12 text-center text-sm text-zinc-400">Публичных профилей нет</li>
          ) : profiles.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
              <div>
                <p className="font-semibold text-zinc-950">{c.name}</p>
                <p className="text-xs text-zinc-500">
                  {c.isPublic ? "Публичен" : "Скрыт"} · {c._count?.listings ?? 0} предложений
                </p>
              </div>
              <Link href={companyPublicPath(c)} target="_blank" className="text-sm font-semibold text-[hsl(var(--nashlo-orange))]">
                Открыть →
              </Link>
            </li>
          ))}
        </ul>
      ) : tab === "inquiries" ? (
        <ul className="mt-6 overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-sm divide-y divide-zinc-100">
          {inquiries.length === 0 ? (
            <li className="px-5 py-12 text-center text-sm text-zinc-400">Запросов прайса нет</li>
          ) : inquiries.map((i) => (
            <li key={i.id} className="flex flex-wrap justify-between gap-2 px-4 py-3 sm:px-5">
              <div>
                <p className="font-medium text-zinc-950">{i.contactName ?? "—"} → {i.toCompany.name}</p>
                <p className="text-xs text-zinc-500">
                  {i.type} · {i.contactPhone} · {new Date(i.createdAt).toLocaleString("ru-RU")}
                </p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => moderate("inquiry", i.id, "SPAM")} className="rounded-lg bg-zinc-100 px-2 py-1 text-xs font-semibold">
                  SPAM
                </button>
                <button type="button" onClick={() => moderate("inquiry", i.id, "CLOSE")} className="rounded-lg bg-zinc-100 px-2 py-1 text-xs font-semibold">
                  Закрыть
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : tab === "reports" ? (
        <ul className="mt-6 overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-sm divide-y divide-zinc-100">
          {reports.length === 0 ? (
            <li className="px-5 py-12 text-center text-sm text-zinc-400">Жалоб нет</li>
          ) : reports.map((r) => (
            <li key={r.id} className="px-4 py-3 sm:px-5">
              <p className="font-medium text-zinc-950">{r.company?.name ?? "B2B"}</p>
              <p className="text-sm text-zinc-600">
                {r.reason}: {r.comment}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="mt-6 overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-sm divide-y divide-zinc-100">
          {listings.length === 0 ? (
            <li className="px-5 py-12 text-center text-sm text-zinc-400">B2B-объявлений на модерации нет</li>
          ) : listings.map((l) => (
            <li key={l.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-5">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-zinc-950">{l.title}</p>
                  <AdminStatusBadge variant="listing" status={l.status} />
                </div>
                <p className="text-sm text-zinc-500">
                  {l.company.name} · {formatPrice(l.price)}
                </p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => moderate("listing", l.id, "APPROVE")} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white">
                  Опубликовать
                </button>
                <button type="button" onClick={() => moderate("listing", l.id, "REJECT")} className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700">
                  Отклонить
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </AdminPageShell>
  )
}
