"use client"

import Link from "next/link"
import { BusinessSectionGuard } from "@/components/business/BusinessSectionGuard"

export default function BusinessDashboardSecurityPage() {
  return (
    <BusinessSectionGuard section="security">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-zinc-950">Безопасность</h1>
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 space-y-4">
          <p className="text-sm text-zinc-600">
            Сессии и подтверждения для работы с компанией. Смена телефона и пароля аккаунта — только в
            личном профиле.
          </p>
          <Link href="/profile/security" className="text-sm font-semibold text-zinc-700 underline">
            Безопасность личного аккаунта →
          </Link>
          <p className="text-xs text-zinc-500">
            Сотрудники компании не получают доступ к /profile владельца — только к разделам бизнес-кабинета
            по своей роли.
          </p>
        </div>
      </div>
    </BusinessSectionGuard>
  )
}
