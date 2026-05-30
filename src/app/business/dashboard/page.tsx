"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { BadgeCheck, Clock, FileText, MessageCircle, Plus } from "lucide-react"
import { useBusinessDashboard } from "@/components/business/BusinessDashboardContext"

type CompanyRow = {
  id: string
  name: string
  verificationStatus: string
  city: string | null
}

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Черновик",
  PENDING_REVIEW: "На проверке",
  VERIFIED: "Проверено",
  REJECTED: "Отклонено",
  BLOCKED: "Заблокировано",
}

export default function BusinessDashboardPage() {
  const { permissions, companyName, verificationStatus } = useBusinessDashboard()
  const [companies, setCompanies] = useState<CompanyRow[]>([])
  const [listingsCount, setListingsCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch("/api/business/companies").then((r) => (r.ok ? r.json() : null)),
      fetch("/api/business/listings?pageSize=1").then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([companiesData, listingsData]) => {
        setCompanies(companiesData?.items ?? [])
        setListingsCount(listingsData?.total ?? 0)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-sm text-zinc-500">Загрузка кабинета…</p>

  const primary = companies[0] ?? { name: companyName, verificationStatus, city: null, id: "" }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-zinc-950">Кабинет бизнеса</h1>
        {permissions.canManageListings && permissions.canPerformActions && (
          <Link href="/business/create" className="inline-flex items-center gap-2 rounded-xl bg-[hsl(var(--nashlo-orange))] px-4 py-2 text-sm font-semibold text-white">
            <Plus className="h-4 w-4" /> Новое предложение
          </Link>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4">
          <p className="text-xs text-zinc-500">Компания</p>
          <p className="mt-1 font-semibold text-zinc-950">{primary.name}</p>
          <p className="mt-1 flex items-center gap-1 text-sm text-zinc-600">
            {(primary.verificationStatus ?? verificationStatus) === "VERIFIED" ? (
              <BadgeCheck className="h-4 w-4 text-emerald-600" />
            ) : (
              <Clock className="h-4 w-4 text-amber-600" />
            )}
            {STATUS_LABEL[primary.verificationStatus] ?? primary.verificationStatus}
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-4">
          <p className="text-xs text-zinc-500">Активные предложения</p>
          <p className="mt-1 text-2xl font-semibold">{listingsCount}</p>
        </div>
        <Link href="/business/dashboard/listings" className="rounded-2xl border border-zinc-200 bg-white p-4 hover:bg-zinc-50">
          <FileText className="h-5 w-5 text-zinc-600" />
          <p className="mt-2 font-semibold text-zinc-950">Мои объявления</p>
        </Link>
        <Link href="/business/dashboard/messages" className="rounded-2xl border border-zinc-200 bg-white p-4 hover:bg-zinc-50">
          <MessageCircle className="h-5 w-5 text-zinc-600" />
          <p className="mt-2 font-semibold text-zinc-950">Сообщения</p>
        </Link>
      </div>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5">
        <h2 className="font-semibold text-zinc-950">Компании</h2>
        <ul className="mt-3 divide-y divide-zinc-100">
          {companies.map((c) => (
            <li key={c.id} className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium">{c.name}</p>
                <p className="text-sm text-zinc-500">{c.city} · {STATUS_LABEL[c.verificationStatus]}</p>
              </div>
              <Link href={`/business/companies/${c.id}`} className="text-sm font-semibold text-[hsl(var(--nashlo-orange))]">
                Профиль
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
