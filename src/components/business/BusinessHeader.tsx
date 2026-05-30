"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { LayoutDashboard, LogIn, Plus, Search } from "lucide-react"
import { BusinessLogo } from "@/components/business/BusinessLogo"
import { PAGE_CONTAINER_CLASS } from "@/components/layout/PageContainer"
import { BUSINESS_BASE_PATH } from "@/lib/business/config"
import { cn } from "@/lib/utils"

const NAV = [
  { href: "/business/listings", label: "Каталог" },
  { href: "/business/companies", label: "Компании" },
  { href: "/business/requests", label: "Заявки" },
  { href: "/business/sell-business", label: "Продажа бизнеса" },
  { href: "/legal/business-advertising", label: "Реклама" },
  { href: "/help", label: "Помощь" },
]

export function BusinessHeader() {
  const pathname = usePathname()
  const isAuth = pathname === "/business/login" || pathname === "/business/register"
  const [loggedIn, setLoggedIn] = useState(false)
  const [hasBusiness, setHasBusiness] = useState(false)
  const [businessUnread, setBusinessUnread] = useState(0)

  useEffect(() => {
    void (async () => {
      const auth = await fetch("/api/auth/me").then((r) => r.ok)
      setLoggedIn(auth)
      if (!auth) {
        setHasBusiness(false)
        return
      }
      const biz = await fetch("/api/business/me").then((r) => (r.ok ? r.json() : null))
      setHasBusiness(Boolean(biz?.hasBusinessProfile))
      if (auth) {
        const unreadRes = await fetch("/api/business/messages/unread")
        if (unreadRes.ok) {
          const unreadData = await unreadRes.json()
          setBusinessUnread(unreadData.unread ?? 0)
        }
      } else {
        setBusinessUnread(0)
      }
    })()
  }, [pathname])

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200/80 bg-white/95 backdrop-blur-md">
      <div className={`${PAGE_CONTAINER_CLASS} flex flex-wrap items-center justify-between gap-3 py-3`}>
        <BusinessLogo />

        {!isAuth && (
          <nav className="order-3 flex w-full basis-full items-center gap-0.5 overflow-x-auto pb-0.5 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] md:order-none md:w-auto md:basis-auto [&::-webkit-scrollbar]:hidden lg:gap-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "shrink-0 rounded-lg px-2.5 py-2 text-sm font-medium transition lg:px-3",
                  pathname.startsWith(item.href)
                    ? "bg-zinc-100 text-zinc-950"
                    : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        )}

        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="hidden text-xs font-medium text-zinc-500 hover:text-zinc-800 xl:inline"
          >
            На Нашло
          </Link>
          {!isAuth && (
            <Link
              href={`${BUSINESS_BASE_PATH}/listings`}
              className="hidden items-center gap-1 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 sm:inline-flex"
            >
              <Search className="h-4 w-4" aria-hidden />
              Поиск
            </Link>
          )}

          {!loggedIn ? (
            <>
              <Link
                href="/business/login"
                className="inline-flex items-center gap-1 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-700"
              >
                <LogIn className="h-4 w-4" aria-hidden />
                <span className="hidden sm:inline">Войти</span>
              </Link>
              <Link
                href="/business/register"
                className="hidden rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-semibold text-zinc-800 sm:inline-block"
              >
                Регистрация
              </Link>
            </>
          ) : hasBusiness ? (
            <Link
              href="/business/dashboard"
              className={cn(
                "relative inline-flex items-center gap-1 rounded-xl px-3 py-2 text-sm font-semibold",
                pathname.startsWith("/business/dashboard")
                  ? "bg-zinc-950 text-white"
                  : "border border-zinc-200 bg-white text-zinc-700",
              )}
            >
              <LayoutDashboard className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">Кабинет</span>
              {businessUnread > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[hsl(var(--nashlo-orange))] px-1 text-[10px] font-bold text-white">
                  {businessUnread > 99 ? "99+" : businessUnread}
                </span>
              )}
            </Link>
          ) : (
            <Link
              href="/business/register"
              className="rounded-xl border border-[hsl(var(--nashlo-orange)/0.35)] bg-orange-50 px-3 py-2 text-sm font-semibold text-[hsl(var(--nashlo-orange))]"
            >
              Создать профиль
            </Link>
          )}

          {!isAuth && (
            <Link
              href="/business/create"
              className="inline-flex items-center gap-1 rounded-xl bg-[hsl(var(--nashlo-orange))] px-3 py-2 text-sm font-semibold text-white shadow-[0_2px_8px_hsl(var(--nashlo-orange)/0.25)]"
            >
              <Plus className="h-4 w-4" aria-hidden />
              <span className="max-w-[120px] truncate sm:max-w-none">B2B-объявление</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
