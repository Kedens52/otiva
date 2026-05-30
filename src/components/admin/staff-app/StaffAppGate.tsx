"use client"

import { useEffect, useState, type ReactNode } from "react"
import { usePathname, useRouter } from "next/navigation"
import { clearStaffAppToken, getStaffAppToken } from "@/lib/admin/staff-app-auth"
import { staffAppFetch } from "@/lib/admin/staff-app-fetch"
import { StaffAppShell } from "@/components/admin/staff-app/StaffAppShell"

export type StaffAppProfile = {
  id: string
  login: string
  displayName: string | null
  role: string
  canSupport: boolean
  permissions: string[]
}

type StaffAppGateProps = {
  children: ReactNode
  requireSupport?: boolean
}

export function StaffAppGate({ children, requireSupport = false }: StaffAppGateProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [profile, setProfile] = useState<StaffAppProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let cancelled = false

    async function boot() {
      if (!getStaffAppToken()) {
        router.replace(`/admin/app/login?next=${encodeURIComponent(pathname)}`)
        return
      }

      const res = await staffAppFetch("/api/admin/auth/app/me")
      if (cancelled) return

      if (!res.ok) {
        clearStaffAppToken()
        router.replace(`/admin/app/login?next=${encodeURIComponent(pathname)}`)
        return
      }

      const data = await res.json()
      if (requireSupport && !data.canSupport) {
        setError("У вашей роли нет доступа к поддержке")
        setLoading(false)
        return
      }

      setProfile({
        id: data.id,
        login: data.login,
        displayName: data.displayName,
        role: data.role,
        canSupport: Boolean(data.canSupport),
        permissions: data.permissions ?? [],
      })
      setLoading(false)
    }

    void boot()
    return () => {
      cancelled = true
    }
  }, [pathname, requireSupport, router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-100">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-zinc-200 border-t-[hsl(var(--nashlo-orange))]" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-100 px-6 text-center">
        <p className="text-lg font-semibold text-zinc-900">{error}</p>
        <button
          type="button"
          onClick={() => {
            clearStaffAppToken()
            router.replace("/admin/app/login")
          }}
          className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white"
        >
          Выйти
        </button>
      </div>
    )
  }

  if (!profile) return null

  return <StaffAppShell profile={profile}>{children}</StaffAppShell>
}
