"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import type { CompanyMemberRole, CompanyVerificationStatus } from "@prisma/client"
import { buildPermissionFlags } from "@/lib/business/permissions"
import {
  BusinessDashboardProvider,
  type BusinessDashboardSession,
} from "@/components/business/BusinessDashboardContext"
import { BusinessDashboardHeader } from "@/components/business/BusinessDashboardHeader"
import { BusinessDashboardNav } from "@/components/business/BusinessDashboardNav"
import { BusinessCompanyStatusBanner } from "@/components/business/BusinessCompanyStatusBanner"
import { PAGE_CONTAINER_CLASS } from "@/components/layout/PageContainer"

type MeResponse = {
  hasBusinessProfile: boolean
  primary: {
    companyId: string
    companyName: string
    role: CompanyMemberRole
    verificationStatus: CompanyVerificationStatus
    rejectionReason: string | null
    isOwner: boolean
  } | null
}

export function BusinessDashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [session, setSession] = useState<BusinessDashboardSession | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const auth = await fetch("/api/auth/me")
      if (!auth.ok) {
        router.replace("/business/login?from=/business/dashboard")
        return
      }
      const biz = await fetch("/api/business/me")
      if (!biz.ok) {
        router.replace("/business/login?from=/business/dashboard")
        return
      }
      const data = (await biz.json()) as MeResponse
      if (cancelled) return
      if (!data.hasBusinessProfile || !data.primary) {
        router.replace("/business/register")
        return
      }
      const p = data.primary
      setSession({
        companyId: p.companyId,
        companyName: p.companyName,
        role: p.role,
        verificationStatus: p.verificationStatus,
        rejectionReason: p.rejectionReason,
        isOwner: p.isOwner,
        permissions: buildPermissionFlags(p.role, p.verificationStatus),
      })
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [router])

  if (loading || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F5F6F8]">
        <p className="text-sm text-zinc-500">Загрузка бизнес-кабинета…</p>
      </div>
    )
  }

  return (
    <BusinessDashboardProvider value={session}>
      <div className="flex min-h-screen flex-col bg-[#F5F6F8]">
        <BusinessDashboardHeader />
        <div className={`${PAGE_CONTAINER_CLASS} flex flex-1 gap-6 py-6 pb-[calc(env(safe-area-inset-bottom)+5rem)] lg:pb-6`}>
          <aside className="hidden w-56 shrink-0 lg:block">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">Кабинет</p>
            <p className="mb-3 truncate text-sm font-semibold text-zinc-800">{session.companyName}</p>
            <BusinessDashboardNav variant="sidebar" />
          </aside>
          <div className="min-w-0 flex-1 space-y-4">
            <BusinessCompanyStatusBanner />
            {children}
          </div>
        </div>
        <BusinessDashboardNav variant="bottom" />
      </div>
    </BusinessDashboardProvider>
  )
}
