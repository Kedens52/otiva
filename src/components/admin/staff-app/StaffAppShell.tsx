"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import type { ReactNode } from "react"
import { ExternalLink, Headphones, LogOut } from "lucide-react"
import { Logo } from "@/components/layout/Logo"
import { clearStaffAppToken } from "@/lib/admin/staff-app-auth"
import { staffAppFetch } from "@/lib/admin/staff-app-fetch"
import type { StaffAppProfile } from "@/components/admin/staff-app/StaffAppGate"

const ROLE_LABEL: Record<string, string> = {
  OWNER: "Владелец",
  ADMIN: "Администратор",
  MODERATOR: "Модератор",
  SUPPORT: "Поддержка",
  BUSINESS_MANAGER: "B2B",
  B2B_MODERATOR: "B2B модерация",
  FINANCE: "Финансы",
}

type StaffAppShellProps = {
  profile: StaffAppProfile
  children: ReactNode
}

export function StaffAppShell({ profile, children }: StaffAppShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const displayName = profile.displayName || profile.login

  async function logout() {
    await staffAppFetch("/api/admin/auth/app/logout", { method: "POST" }).catch(() => {})
    clearStaffAppToken()
    router.replace("/admin/app/login")
  }

  const nav = [
    ...(profile.canSupport
      ? [{ href: "/admin/app/support", label: "Поддержка", icon: Headphones }]
      : []),
  ]

  return (
    <div className="flex h-screen min-h-0 flex-col overflow-hidden bg-zinc-100">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-4">
        <div className="flex min-w-0 items-center gap-3">
          <Logo size="compact" />
          <div className="hidden min-w-0 sm:block">
            <p className="truncate text-sm font-semibold text-zinc-950">Нашло · Staff</p>
            <p className="truncate text-xs text-zinc-500">{ROLE_LABEL[profile.role] ?? profile.role}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden max-w-[180px] truncate text-sm text-zinc-600 md:inline">{displayName}</span>
          <a
            href="/admin/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-zinc-200 px-3 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Полная панель
          </a>
          <button
            type="button"
            onClick={() => void logout()}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-zinc-900 px-3 text-xs font-semibold text-white hover:bg-zinc-800"
          >
            <LogOut className="h-3.5 w-3.5" />
            Выйти
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        {nav.length > 0 ? (
          <aside className="hidden w-52 shrink-0 flex-col border-r border-zinc-200 bg-white py-3 md:flex">
            <nav className="space-y-0.5 px-2">
              {nav.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                      active
                        ? "bg-[hsl(var(--nashlo-orange)/0.12)] text-[hsl(var(--nashlo-orange))]"
                        : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                    {item.label}
                  </Link>
                )
              })}
            </nav>
            <p className="mt-auto px-4 pb-2 text-[11px] leading-snug text-zinc-400">
              Установка: Chrome / Edge → «Установить приложение» на этой странице
            </p>
          </aside>
        ) : null}

        <main className="min-h-0 min-w-0 flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  )
}
