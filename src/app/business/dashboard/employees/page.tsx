"use client"

import { BusinessSectionGuard } from "@/components/business/BusinessSectionGuard"
import { useBusinessDashboard } from "@/components/business/BusinessDashboardContext"

export default function BusinessDashboardEmployeesPage() {
  const { role } = useBusinessDashboard()

  return (
    <BusinessSectionGuard section="employees">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-zinc-950">Сотрудники и доступ</h1>
        <div className="rounded-2xl border border-zinc-200 bg-white p-6">
          <p className="text-sm text-zinc-600">
            Приглашение сотрудников по ролям (ADMIN, MANAGER, SALES, SUPPORT, VIEWER). Сотрудники
            получают доступ только к бизнес-кабинету компании, не к личному профилю владельца.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-zinc-700">
            <li>OWNER — полный доступ</li>
            <li>ADMIN — всё, кроме удаления владельца</li>
            <li>MANAGER — объявления, заявки, сообщения</li>
            <li>SALES — заявки и сообщения</li>
            <li>SUPPORT — сообщения</li>
            <li>VIEWER — только просмотр</li>
          </ul>
          <p className="mt-4 text-xs text-zinc-500">Ваша роль: {role}</p>
        </div>
      </div>
    </BusinessSectionGuard>
  )
}
