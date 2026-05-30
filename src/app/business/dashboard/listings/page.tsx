"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Plus } from "lucide-react"
import { BusinessSectionGuard } from "@/components/business/BusinessSectionGuard"
import { useBusinessDashboard } from "@/components/business/BusinessDashboardContext"

type Listing = {
  id: string
  title: string
  slug: string
  status: string
  listingType: string
}

export default function BusinessDashboardListingsPage() {
  const { permissions } = useBusinessDashboard()
  const [items, setItems] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/business/listings?pageSize=50")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setItems(data?.items ?? []))
      .finally(() => setLoading(false))
  }, [])

  return (
    <BusinessSectionGuard section="listings">
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-zinc-950">B2B-объявления</h1>
        {permissions.canManageListings && (
          <Link
            href="/business/create"
            className="inline-flex items-center gap-2 rounded-xl bg-[hsl(var(--nashlo-orange))] px-4 py-2 text-sm font-semibold text-white"
          >
            <Plus className="h-4 w-4" /> Новое
          </Link>
        )}
      </div>
      {loading ? (
        <p className="text-sm text-zinc-500">Загрузка…</p>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center">
          <p className="text-zinc-600">Пока нет B2B-объявлений</p>
          <Link href="/business/create" className="mt-3 inline-block text-sm font-semibold text-[hsl(var(--nashlo-orange))]">
            Разместить первое →
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-zinc-100 rounded-2xl border border-zinc-200 bg-white">
          {items.map((l) => (
            <li key={l.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate font-medium text-zinc-950">{l.title}</p>
                <p className="text-xs text-zinc-500">
                  {l.listingType} · {l.status}
                </p>
              </div>
              <Link href={`/business/listings/${l.slug}`} className="shrink-0 text-sm font-semibold text-[hsl(var(--nashlo-orange))]">
                Открыть
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
    </BusinessSectionGuard>
  )
}
