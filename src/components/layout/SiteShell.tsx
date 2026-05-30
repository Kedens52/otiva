"use client"

import { Suspense } from "react"
import { usePathname } from "next/navigation"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import { Breadcrumbs } from "@/components/layout/Breadcrumbs"
import { isCabinetRoute } from "@/lib/cabinet-routes"
import { hasDedicatedBreadcrumbs } from "@/lib/categories/listing-breadcrumbs"
import { MobileAdBanner } from "@/components/marketplace/MobileAdBanner"
import { CookieBanner } from "@/components/legal/CookieBanner"
import { CookieConsentSync } from "@/components/legal/CookieConsentSync"
import { SiteVisitTracker } from "@/components/analytics/SiteVisitTracker"
import { YandexMetrika } from "@/components/analytics/YandexMetrika"
import { BannerSlotsProvider } from "@/components/ads/BannerSlotsProvider"
import { TopSiteBanner } from "@/components/marketplace/TopSiteBanner"

export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAdmin = pathname.startsWith("/admin")
  const isBusinessHub = pathname.startsWith("/business")
  const isCabinet = isCabinetRoute(pathname)
  const isAuthPage = pathname === "/login" || pathname === "/register"
  const isChatApp = pathname === "/chat" || pathname.startsWith("/messages/") || pathname === "/support"
  const isMessageThread = pathname.startsWith("/messages/")
  const isCreatePage = pathname === "/create"
  const isBrowseSurface =
    pathname === "/search" ||
    pathname.startsWith("/search?") ||
    pathname === "/categories" ||
    pathname.startsWith("/categories/")
  const isListingDetail = /^\/listings\/[^/]+$/.test(pathname)
  const isProfileHub = pathname === "/profile"
  const showSiteHeader = !isAuthPage
  const showMarketplaceChrome = !isAuthPage && !isCabinet
  const showTopBanner = showMarketplaceChrome && !isChatApp
  const showMobileAd = showMarketplaceChrome && !isChatApp && !isCreatePage && !isBrowseSurface && pathname !== "/" && !isListingDetail
  const showCookieBanner = !isAdmin && showMarketplaceChrome && !isChatApp
  const showFooter = showMarketplaceChrome && !isChatApp
  const showBreadcrumbs = showMarketplaceChrome && !isChatApp && !hasDedicatedBreadcrumbs(pathname)
  const mainPaddingClass = isAuthPage
    ? "pb-0"
    : isCabinet
      ? isChatApp
        ? ("flex min-h-0 flex-col " + (isMessageThread ? "pb-0" : "pb-[calc(env(safe-area-inset-bottom)+var(--nashlo-mobile-nav-h))]") + " lg:overflow-hidden lg:pb-0")
        : "pb-[calc(env(safe-area-inset-bottom)+var(--nashlo-mobile-nav-h))] lg:pb-0"
      : isCreatePage
        ? "pb-[calc(env(safe-area-inset-bottom)+5.75rem)] lg:pb-0"
      : isChatApp
        ? ("flex min-h-0 flex-col " + (isMessageThread ? "pb-0" : "pb-[calc(env(safe-area-inset-bottom)+var(--nashlo-mobile-nav-h))]") + " lg:overflow-hidden lg:pb-0")
        : isListingDetail
          ? "pb-0 lg:pb-0"
          : isProfileHub
            ? "pb-[calc(env(safe-area-inset-bottom)+var(--nashlo-mobile-nav-h)+0.875rem)] lg:pb-0"
            : showMobileAd
              ? "pb-[calc(env(safe-area-inset-bottom)+var(--nashlo-mobile-nav-h)+var(--nashlo-mobile-ad-h)+1.25rem)] lg:pb-0"
              : "pb-[calc(env(safe-area-inset-bottom)+var(--nashlo-mobile-nav-h)+0.875rem)] lg:pb-0"

  if (isAdmin || isBusinessHub) {
    return <>{children}</>
  }

  return (
    <div className={"flex flex-col bg-[#F5F6F8] text-zinc-950 " + (isChatApp ? "min-h-screen lg:h-screen lg:overflow-hidden" : "min-h-screen")}>
      <Suspense fallback={null}>
        <CookieConsentSync />
        <SiteVisitTracker />
        <YandexMetrika />
      </Suspense>
      {showTopBanner ? <TopSiteBanner /> : null}
      {showSiteHeader ? (
        <Suspense fallback={null}>
          <Header />
        </Suspense>
      ) : null}
      <BannerSlotsProvider>
        <main className={"min-w-0 w-full flex-1 overflow-x-hidden " + mainPaddingClass}>
          {showBreadcrumbs ? <Breadcrumbs /> : null}
          {children}
        </main>
        {showMobileAd ? <MobileAdBanner /> : null}
        {showCookieBanner ? <CookieBanner reserveMobileAdSpace={showMobileAd} /> : null}
        {showFooter ? (
          <div className="pb-[calc(env(safe-area-inset-bottom)+var(--nashlo-mobile-nav-h))] lg:pb-0">
            <Footer />
          </div>
        ) : null}
      </BannerSlotsProvider>
    </div>
  )
}
