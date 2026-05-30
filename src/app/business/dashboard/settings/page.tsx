"use client"

import { BusinessSectionGuard } from "@/components/business/BusinessSectionGuard"
import { useBusinessDashboard } from "@/components/business/BusinessDashboardContext"

export default function BusinessDashboardSettingsPage() {
  const { companyName } = useBusinessDashboard()

  return (
    <BusinessSectionGuard section="settings">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-zinc-950">Настройки компании</h1>
        <div className="rounded-2xl border border-zinc-200 bg-white p-6">
          <p className="text-sm text-zinc-600">
            Настройки бизнес-зоны для «{companyName}». Не связаны с личными настройками в /profile/settings.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-zinc-700">
            <li>Уведомления по B2B-объявлениям и заявкам</li>
            <li>Публичность профиля компании</li>
            <li>Контакты для откликов</li>
          </ul>
        </div>
      </div>
    </BusinessSectionGuard>
  )
}
