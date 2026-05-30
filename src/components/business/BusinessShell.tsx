"use client"

import { usePathname } from "next/navigation"
import { BusinessHeader } from "@/components/business/BusinessHeader"
import { BusinessFooter } from "@/components/business/BusinessFooter"
import { PAGE_CONTAINER_CLASS } from "@/components/layout/PageContainer"

/** Публичная оболочка /business (не кабинет). */
export function BusinessShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  if (pathname.startsWith("/business/dashboard")) {
    return <>{children}</>
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#F5F6F8]">
      <BusinessHeader />
      <main className={`${PAGE_CONTAINER_CLASS} flex-1 py-6`}>{children}</main>
      <BusinessFooter />
    </div>
  )
}
