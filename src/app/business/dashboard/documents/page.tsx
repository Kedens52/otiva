"use client"

import { BusinessSectionGuard } from "@/components/business/BusinessSectionGuard"

export default function BusinessDashboardDocumentsPage() {
  return (
    <BusinessSectionGuard section="documents">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-zinc-950">Документы</h1>
        <div className="rounded-2xl border border-zinc-200 bg-white p-6">
          <p className="text-sm text-zinc-600">
            Загрузка учредительных документов и доверенностей для модерации. Документы не публикуются
            на сайте и доступны только модераторам B2B.
          </p>
          <p className="mt-3 text-xs text-zinc-500">Загрузка файлов — в следующем обновлении.</p>
        </div>
      </div>
    </BusinessSectionGuard>
  )
}
