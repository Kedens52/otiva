"use client"

import { createContext, useContext } from "react"
import type { CompanyMemberRole, CompanyVerificationStatus } from "@prisma/client"
import type { buildPermissionFlags } from "@/lib/business/permissions"

export type BusinessDashboardSession = {
  companyId: string
  companyName: string
  role: CompanyMemberRole
  verificationStatus: CompanyVerificationStatus
  rejectionReason: string | null
  isOwner: boolean
  permissions: ReturnType<typeof buildPermissionFlags>
}

const Ctx = createContext<BusinessDashboardSession | null>(null)

export function BusinessDashboardProvider({
  value,
  children,
}: {
  value: BusinessDashboardSession
  children: React.ReactNode
}) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useBusinessDashboard() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error("useBusinessDashboard outside provider")
  return ctx
}
