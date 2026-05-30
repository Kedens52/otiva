"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import type { Permission } from "@/lib/admin/permissions"
import { getAdminCsrfFromDocument } from "@/lib/admin/csrf-client"

type NavItem = {
  href: string
  label: string
  permission: Permission
  icon: React.ReactNode
}

type NavSection = {
  id: string
  title: string
  items: NavItem[]
}

const NAV_SECTIONS: NavSection[] = [
  {
    id: "overview",
    title: "Обзор",
    items: [
      {
        href: "/admin/dashboard",
        label: "Дашборд",
        permission: "dashboard.view",
        icon: (
          <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
        ),
      },
      {
        href: "/admin/analytics",
        label: "Аналитика",
        permission: "dashboard.view",
        icon: (
          <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4v16" />
          </svg>
        ),
      },
      {
        href: "/admin/seo/sitemap",
        label: "SEO / Sitemap",
        permission: "listings.view",
        icon: (
          <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" />
          </svg>
        ),
      },
    ],
  },
  {
    id: "moderation",
    title: "Модерация",
    items: [
      {
        href: "/admin/moderation",
        label: "Очередь и жалобы",
        permission: "listings.moderate",
        icon: (
          <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        ),
      },
      {
        href: "/admin/listings",
        label: "Объявления",
        permission: "listings.view",
        icon: (
          <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        ),
      },
      {
        href: "/admin/reviews",
        label: "Отзывы",
        permission: "listings.moderate",
        icon: (
          <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        ),
      },
      {
        href: "/admin/want-to-buy",
        label: "Куплю",
        permission: "listings.moderate",
        icon: (
          <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        ),
      },
    ],
  },
  {
    id: "users",
    title: "Пользователи",
    items: [
      {
        href: "/admin/users",
        label: "Аккаунты",
        permission: "users.view",
        icon: (
          <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        ),
      },
      {
        href: "/admin/user-chats",
        label: "Диалоги",
        permission: "users.viewChats",
        icon: (
          <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        ),
      },
      {
        href: "/admin/bonuses",
        label: "Баллы «Нашло»",
        permission: "users.view",
        icon: (
          <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
      },
      {
        href: "/admin/referrals",
        label: "Рефералы",
        permission: "users.view",
        icon: (
          <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
        ),
      },
    ],
  },
  {
    id: "support",
    title: "Поддержка",
    items: [
      {
        href: "/admin/support",
        label: "Обращения",
        permission: "support.view",
        icon: (
          <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        ),
      },
    ],
  },
  {
    id: "ads",
    title: "Реклама",
    items: [
      {
        href: "/admin/ads",
        label: "Места, баннеры, кампании",
        permission: "settings.view",
        icon: (
          <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        ),
      },
    ],
  },
  {
    id: "business",
    title: "Бизнес",
    items: [
      {
        href: "/admin/business",
        label: "Бизнес CRM",
        permission: "business.view",
        icon: (
          <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 00-1-1h-2a1 1 0 00-1 1v5m4 0H9" />
          </svg>
        ),
      },
      {
        href: "/admin/b2b",
        label: "Нашло Бизнес",
        permission: "b2b.companies.view",
        icon: (
          <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        ),
      },
    ],
  },
  {
    id: "finance",
    title: "Финансы",
    items: [
      {
        href: "/admin/payments",
        label: "Платежи",
        permission: "payments.view",
        icon: (
          <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        ),
      },
    ],
  },
  {
    id: "system",
    title: "Система",
    items: [
      {
        href: "/admin/staff",
        label: "Сотрудники",
        permission: "staff.view",
        icon: (
          <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        ),
      },
      {
        href: "/admin/audit",
        label: "Аудит",
        permission: "audit.view",
        icon: (
          <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        ),
      },
      {
        href: "/admin/listing-ranking",
        label: "Ранжирование",
        permission: "settings.view",
        icon: (
          <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h13M3 8h9m-9 4h6m10 0l4-4m0 0l4 4m-4-4v12" />
          </svg>
        ),
      },
      {
        href: "/admin/settings",
        label: "Настройки",
        permission: "settings.view",
        icon: (
          <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        ),
      },
    ],
  },
]

function resolveActiveHref(pathname: string, hrefs: string[]): string | null {
  const sorted = [...hrefs].sort((a, b) => b.length - a.length)
  return sorted.find((href) => pathname === href || pathname.startsWith(`${href}/`)) ?? null
}

type Props = {
  displayName: string | null
  login: string
  role: string
  permissions: Permission[]
}

export function AdminSidebar({ displayName, login, role, permissions }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const sections = useMemo(
    () =>
      NAV_SECTIONS.map((section) => ({
        ...section,
        items: section.items.filter((item) => permissions.includes(item.permission)),
      })).filter((section) => section.items.length > 0),
    [permissions],
  )

  const allHrefs = useMemo(() => sections.flatMap((s) => s.items.map((i) => i.href)), [sections])
  const activeHref = resolveActiveHref(pathname, allHrefs)

  const activeSection = sections.find((section) =>
    section.items.some((item) => item.href === activeHref),
  )

  const activeItem = sections.flatMap((s) => s.items).find((item) => item.href === activeHref)

  function getCsrfCookie(): string {
    return getAdminCsrfFromDocument()
  }

  async function logout() {
    setLoggingOut(true)
    try {
      await fetch("/api/admin/auth/logout", {
        method: "POST",
        headers: { "X-CSRF-Token": getCsrfCookie() },
      })
    } finally {
      router.push("/admin/login")
    }
  }

  const ROLE_LABELS: Record<string, string> = {
    OWNER: "Владелец",
    ADMIN: "Администратор",
    MODERATOR: "Модератор",
    SUPPORT: "Поддержка",
    BUSINESS_MANAGER: "Бизнес-менеджер",
    B2B_MODERATOR: "B2B модерация",
    FINANCE: "Финансы",
  }

  const navContent = (
    <>
      <div className="flex h-[60px] shrink-0 items-center gap-3 border-b border-zinc-200/90 px-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[hsl(var(--nashlo-orange))] shadow-sm">
          <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold tracking-tight text-zinc-950">Нашло</p>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-400">Admin</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 pb-6">
        <div className="space-y-5">
          {sections.map((section) => (
            <div key={section.id}>
              <p className="mb-1.5 px-2 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-400">
                {section.title}
              </p>
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const active = item.href === activeHref
                  const nested = item.href.includes("/") && item.href.split("/").length > 3
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={[
                          "group flex items-center gap-2.5 rounded-xl py-2 text-[13px] font-semibold transition",
                          nested ? "pl-7 pr-3" : "px-3",
                          active
                            ? "bg-[hsl(var(--nashlo-orange))] text-white shadow-sm shadow-[hsl(var(--nashlo-orange)/0.35)]"
                            : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950",
                        ].join(" ")}
                      >
                        <span
                          className={[
                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition",
                            active
                              ? "bg-white/20 text-white"
                              : "bg-zinc-100 text-zinc-500 group-hover:bg-white group-hover:text-zinc-700",
                          ].join(" ")}
                        >
                          {item.icon}
                        </span>
                        <span className="truncate">{item.label}</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
      </nav>

      <div className="shrink-0 space-y-2 border-t border-zinc-200/90 px-3 py-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-600 transition hover:border-zinc-300 hover:text-zinc-900"
        >
          Открыть сайт
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
        <div className="flex items-center gap-2.5 rounded-xl bg-zinc-50 px-3 py-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-xs font-bold text-white">
            {((displayName ?? login).trim() || "?").slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-zinc-950">{displayName ?? login}</p>
            <p className="truncate text-xs text-zinc-500">{ROLE_LABELS[role] ?? role}</p>
          </div>
        </div>
        {permissions.includes("support.view") ? (
          <a
            href="/admin/app/support"
            className="mb-2 flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-white"
          >
            Приложение для ПК
          </a>
        ) : null}
        <button
          type="button"
          onClick={logout}
          disabled={loggingOut}
          className="flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-zinc-500 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
        >
          {loggingOut ? "Выход..." : "Выйти"}
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile top bar */}
      <header className="fixed inset-x-0 top-0 z-40 flex items-center gap-3 border-b border-zinc-200 bg-white/95 px-4 pb-2 pt-[calc(env(safe-area-inset-top)+0.5rem)] shadow-sm backdrop-blur lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 text-zinc-700"
          aria-label="Открыть меню"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-zinc-950">{activeItem?.label ?? "Админка"}</p>
          {activeSection && (
            <p className="truncate text-xs text-zinc-500">{activeSection.title}</p>
          )}
        </div>
      </header>

      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-zinc-950/40 backdrop-blur-[2px] lg:hidden"
          aria-label="Закрыть меню"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r border-zinc-200/90 bg-white shadow-xl transition-transform duration-200 lg:static lg:z-auto lg:translate-x-0 lg:shadow-[2px_0_24px_rgba(15,23,42,0.04)]",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 lg:hidden"
          aria-label="Закрыть меню"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        {navContent}
      </aside>
    </>
  )
}
