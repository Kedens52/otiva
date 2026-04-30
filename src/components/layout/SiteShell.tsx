"use client"

import { usePathname } from "next/navigation"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import { Breadcrumbs } from "@/components/layout/Breadcrumbs"

export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAdmin = pathname.startsWith("/admin")

  if (isAdmin) {
    return <>{children}</>
  }

  return (
    <div className="flex min-h-screen flex-col bg-white text-zinc-950">
      <Header />
      <main className="flex-1 pb-16 lg:pb-0">
        <Breadcrumbs />
        {children}
      </main>
      <div className="hidden lg:block">
        <Footer />
      </div>
    </div>
  )
}
