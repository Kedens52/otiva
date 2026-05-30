"use client"

import Link from "next/link"
import type { BusinessSection } from "@/lib/business/permissions"
import { canAccessSection } from "@/lib/business/permissions"
import { useBusinessDashboard } from "@/components/business/BusinessDashboardContext"

export function BusinessSectionGuard({
  section,
  children,
}: {
  section: BusinessSection
  children: React.ReactNode
}) {
  const { role, companyName } = useBusinessDashboard()

  if (!canAccessSection(role, section)) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center">
        <p className="font-semibold text-zinc-950">Нет доступа к разделу</p>
        <p className="mt-2 text-sm text-zinc-600">
          Ваша роль в компании «{companyName}» не включает этот раздел. Обратитесь к владельцу или
          администратору.
        </p>
        <Link href="/business/dashboard" className="mt-4 inline-block text-sm font-semibold text-[hsl(var(--nashlo-orange))]">
          ← В обзор
        </Link>
      </div>
    )
  }

  return <>{children}</>
}
