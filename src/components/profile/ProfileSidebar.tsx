"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { CABINET_NAV_SECTIONS, isCabinetNavActive } from "@/config/cabinet-nav"
import { isChatAppRoute } from "@/lib/cabinet-routes"

export function ProfileSidebar() {
  const pathname = usePathname()
  const isChatRoute = isChatAppRoute(pathname)
  const showMobileNav = !isChatRoute
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    fetch("/api/messages/conversations")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d?.conversations) return
        const count = d.conversations.reduce(
          (sum: number, c: { unreadCount?: number }) => sum + (c.unreadCount ?? 0),
          0,
        )
        setUnread(count)
      })
      .catch(() => {})
  }, [pathname])

  const navLinks = (
    <nav className="space-y-4">
      {CABINET_NAV_SECTIONS.map((section) => (
        <div key={section.title ?? "main"}>
          {section.title ? (
            <p className="mb-1.5 px-3.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
              {section.title}
            </p>
          ) : null}
          <div className="space-y-0.5">
            {section.items.map((item) => {
              const active = isCabinetNavActive(pathname, item)
              const showBadge = item.badge && unread > 0
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors ${
                    active
                      ? "bg-[hsl(var(--nashlo-orange)/0.12)] text-[hsl(var(--nashlo-orange))] ring-1 ring-[hsl(var(--nashlo-orange)/0.15)]"
                      : "text-zinc-700 hover:bg-zinc-50 hover:text-zinc-950"
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block">{item.label}</span>
                    {item.subtitle ? (
                      <span className="mt-0.5 block text-xs font-normal leading-snug text-zinc-500">
                        {item.subtitle}
                      </span>
                    ) : null}
                  </span>
                  {showBadge ? (
                    <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[hsl(var(--nashlo-orange))] px-1.5 text-[10px] font-bold text-white">
                      {unread > 99 ? "99+" : unread}
                    </span>
                  ) : null}
                </Link>
              )
            })}
          </div>
        </div>
      ))}
    </nav>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`hidden w-[252px] shrink-0 lg:block ${isChatRoute ? "lg:self-stretch" : ""}`}
      >
        <div className={isChatRoute ? "flex h-full flex-col gap-4" : "sticky top-24 space-y-4"}>
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
            <p className="text-[15px] font-semibold text-zinc-950">Личный кабинет</p>
            <p className="mt-1 text-sm leading-snug text-zinc-500">
              Объявления, заявки «Куплю» и настройки
            </p>
            <div className="mt-4">{navLinks}</div>
            <div className="mt-3 border-t border-zinc-100 pt-3">
              <button
                type="button"
                onClick={async () => {
                  await fetch("/api/auth/logout", { method: "POST" })
                  window.location.href = "/"
                }}
                className="flex w-full items-center rounded-xl px-3.5 py-2.5 text-left text-sm font-medium text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600"
              >
                Выйти
              </button>
            </div>
          </div>

          {!isChatRoute ? (
            <Link
              href="/profile/promotion"
              className="block rounded-2xl border border-orange-100 bg-gradient-to-br from-[#FFF6F0] to-white p-4 transition hover:border-orange-200"
            >
              <p className="text-sm font-semibold text-zinc-950">Продвигайте объявления</p>
              <p className="mt-1 text-sm text-zinc-600">Поднятие и выделение в поиске</p>
              <span className="mt-2 inline-flex text-sm font-semibold text-[hsl(var(--nashlo-orange))]">
                Открыть →
              </span>
            </Link>
          ) : null}
        </div>
      </aside>

      {/* Mobile: только на внутренних страницах кабинета (не профиль-хаб и не чат) */}
      {showMobileNav ? (
        <div className="mb-4 w-full min-w-0 lg:hidden">
          <div className="flex snap-x snap-mandatory gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {CABINET_NAV_SECTIONS.flatMap((s) => s.items).map((item) => {
              const active = isCabinetNavActive(pathname, item)
              const showBadge = item.badge && unread > 0
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex shrink-0 snap-start items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition ${
                    active
                      ? "bg-[hsl(var(--nashlo-orange))] text-white"
                      : "bg-white text-zinc-600 ring-1 ring-zinc-200"
                  }`}
                >
                  {item.label}
                  {showBadge ? (
                    <span
                      className={`flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold ${
                        active ? "bg-white/25 text-white" : "bg-[hsl(var(--nashlo-orange))] text-white"
                      }`}
                    >
                      {unread > 9 ? "9+" : unread}
                    </span>
                  ) : null}
                </Link>
              )
            })}
          </div>
        </div>
      ) : null}
    </>
  )
}
