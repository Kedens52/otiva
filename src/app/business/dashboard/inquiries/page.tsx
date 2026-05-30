"use client"

import { useEffect, useState } from "react"
import { BusinessSectionGuard } from "@/components/business/BusinessSectionGuard"

type Inquiry = {
  id: string
  type: string
  contactName: string | null
  contactCompany: string | null
  contactPhone: string | null
  quantity: string | null
  city: string | null
  message: string | null
  status: string
  createdAt: string
}

export default function BusinessDashboardInquiriesPage() {
  const [items, setItems] = useState<Inquiry[]>([])

  useEffect(() => {
    fetch("/api/business/inquiries")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setItems(data?.items ?? []))
  }, [])

  return (
    <BusinessSectionGuard section="requests">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-zinc-950">Запросы прайса и КП</h1>
        {items.length === 0 ? (
          <p className="text-sm text-zinc-500">Пока нет входящих запросов.</p>
        ) : (
          <ul className="divide-y divide-zinc-100 rounded-2xl border border-zinc-200 bg-white">
            {items.map((i) => (
              <li key={i.id} className="p-4">
                <p className="font-semibold text-zinc-950">
                  {i.contactName ?? "Без имени"}
                  {i.contactCompany ? ` · ${i.contactCompany}` : ""}
                </p>
                <p className="text-xs text-zinc-500">
                  {i.type} · {i.status} · {new Date(i.createdAt).toLocaleDateString("ru-RU")}
                </p>
                {i.message && <p className="mt-2 text-sm text-zinc-600">{i.message}</p>}
                {i.contactPhone && <p className="mt-1 text-sm">{i.contactPhone}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </BusinessSectionGuard>
  )
}
