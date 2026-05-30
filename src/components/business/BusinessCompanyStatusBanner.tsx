"use client"

import Link from "next/link"
import { useBusinessDashboard } from "@/components/business/BusinessDashboardContext"

export function BusinessCompanyStatusBanner() {
  const { verificationStatus, rejectionReason, permissions } = useBusinessDashboard()

  if (verificationStatus === "VERIFIED") return null

  if (verificationStatus === "PENDING_REVIEW") {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
        <p className="font-semibold">Компания на проверке</p>
        <p className="mt-1 text-amber-900/90">
          Кабинет доступен в ограниченном режиме: до 3 B2B-объявлений до завершения модерации.
        </p>
      </div>
    )
  }

  if (verificationStatus === "DRAFT") {
    return (
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-800">
        <p className="font-semibold">Черновик компании</p>
        <p className="mt-1">Заполните данные и отправьте на проверку, чтобы публиковать предложения.</p>
        <Link href="/business/dashboard/company" className="mt-2 inline-block text-sm font-semibold text-[hsl(var(--nashlo-orange))]">
          Перейти к компании →
        </Link>
      </div>
    )
  }

  if (verificationStatus === "REJECTED") {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-950">
        <p className="font-semibold">Компания отклонена</p>
        <p className="mt-1">
          {rejectionReason || "Исправьте данные компании или обратитесь в поддержку."}
        </p>
        {permissions.canManageCompany && (
          <Link href="/business/dashboard/company" className="mt-2 inline-block text-sm font-semibold text-red-800 underline">
            Исправить данные →
          </Link>
        )}
      </div>
    )
  }

  if (verificationStatus === "BLOCKED") {
    return (
      <div className="rounded-xl border border-red-300 bg-red-100 px-4 py-3 text-sm text-red-950">
        <p className="font-semibold">Доступ ограничен</p>
        <p className="mt-1">Компания заблокирована. Публикация и новые действия недоступны.</p>
        <Link href="/support" className="mt-2 inline-block text-sm font-semibold text-red-800">
          Связаться с поддержкой →
        </Link>
      </div>
    )
  }

  return null
}
