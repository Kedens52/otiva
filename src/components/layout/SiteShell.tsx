"use client"

import { usePathname } from "next/navigation"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import { Breadcrumbs } from "@/components/layout/Breadcrumbs"
import { MobileAdBanner } from "@/components/marketplace/MobileAdBanner"

export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAdmin = pathname.startsWith("/admin")
  const isChatApp = pathname === "/chat" || pathname.startsWith("/messages/") || pathname === "/support"

  if (isAdmin) {
    return <>{children}</>
  }

  return (
    <div className="flex min-h-screen flex-col bg-white text-zinc-950">
      <div className={isChatApp ? "hidden lg:block" : ""}>
        <Header />
      </div>
      <main className={`flex-1 overflow-x-hidden ${isChatApp ? "pb-0" : "pb-24 lg:pb-0"}`}>
        {!isChatApp && <Breadcrumbs />}
        {children}
      </main>
      {!isChatApp && <MobileAdBanner />}
      <div className="hidden lg:block">
        <Footer />
      </div>
    </div>
  )
}
