"use client"

import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { ProfileSidebar } from "@/components/profile/ProfileSidebar"
import { PAGE_CONTAINER_WIDE_CLASS } from "@/components/layout/PageContainer"
import { isChatAppRoute } from "@/lib/cabinet-routes"

export function ProfileProtectedLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const isChatApp = isChatAppRoute(pathname)
  const isProfileHub = pathname === "/profile"

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => {
        if (r.status === 401) {
          router.replace(`/login?return=${encodeURIComponent(pathname)}`)
          return null
        }
        return r.json()
      })
      .then((data) => {
        if (data) setReady(true)
      })
      .catch(() => {
        router.replace(`/login?return=${encodeURIComponent(pathname)}`)
      })
  }, [pathname, router])

  if (!ready) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-[#F5F6F8]">
        <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-zinc-200 border-t-[hsl(var(--nashlo-orange))]" />
      </div>
    )
  }

  return (
    <div className="w-full bg-[#F5F6F8]">
      <div
        className={`${PAGE_CONTAINER_WIDE_CLASS} ${
          isChatApp
            ? "pb-0 pt-2 lg:py-4"
            : isProfileHub
              ? "px-4 py-2 pb-0 sm:px-5 sm:py-3 lg:px-6 lg:py-6 lg:pb-6"
              : "py-3 pb-8 sm:py-5 lg:py-6 lg:pb-6"
        }`}
      >
        <div
          className={`w-full ${
            isChatApp
              ? "flex min-h-0 flex-col lg:h-[calc(100dvh-7.25rem)] lg:max-h-[calc(100dvh-7.25rem)] lg:flex-row lg:items-stretch lg:gap-5 lg:overflow-hidden"
              : "flex flex-col lg:flex-row lg:items-start lg:gap-6"
          }`}
        >
          <ProfileSidebar />
          <div
            className={`min-w-0 w-full flex-1 ${
              isChatApp ? "flex min-h-0 flex-col overflow-hidden" : ""
            }`}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
