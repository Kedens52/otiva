"use client"

import Link from "next/link"
import { BusinessSectionGuard } from "@/components/business/BusinessSectionGuard"
import { useBusinessDashboard } from "@/components/business/BusinessDashboardContext"

export default function BusinessDashboardRequestsPage() {
  const { permissions } = useBusinessDashboard()

  return (
    <BusinessSectionGuard section="requests">
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-zinc-950">Заявки</h1>
      <div className="rounded-2xl border border-zinc-200 bg-white p-6">
        <p className="text-sm text-zinc-600">
          Заявки на закупку и входящие запросы прайса от покупателей.
        </p>
        <Link
          href="/business/dashboard/inquiries"
          className="mt-3 inline-block text-sm font-semibold text-[hsl(var(--nashlo-orange))]"
        >
          Входящие запросы прайса →
        </Link>
        {permissions.canManageRequests && (
          <Link
            href="/business/requests/create"
            className="mt-4 inline-block rounded-xl bg-[hsl(var(--nashlo-orange))] px-4 py-2 text-sm font-semibold text-white"
          >
            Создать заявку
          </Link>
        )}
        <Link href="/business/requests" className="mt-3 ml-4 inline-block text-sm font-semibold text-zinc-700">
          Каталог заявок →
        </Link>
      </div>
    </div>
    </BusinessSectionGuard>
  )
}
