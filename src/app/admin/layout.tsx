"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"

const NAV = [
  { href: "/admin/moderation", label: "Модерация",  icon: "🛡" },
  { href: "/admin/listings",   label: "Объявления", icon: "📋" },
  { href: "/admin/users",      label: "Пользователи", icon: "👤" },
  { href: "/admin/analytics",  label: "Аналитика",  icon: "📊" },
  { href: "/admin/settings",   label: "Настройки",  icon: "⚙" },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  // Admin login page gets no shell
  if (pathname === "/admin/login") return <>{children}</>

  async function logout() {
    await fetch("/api/admin/session", { method: "DELETE" })
    router.push("/admin/login")
    router.refresh()
  }

  return (
    <div className="flex min-h-screen bg-zinc-950 text-white">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-white/10 bg-zinc-950">
        <div className="flex h-16 items-center gap-3 border-b border-white/10 px-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[hsl(var(--otiva-orange))] text-xs font-bold text-white">
            О
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Отива</p>
            <p className="text-[11px] text-zinc-500">Dev console</p>
          </div>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
          {NAV.map((item) => {
            const active = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? "bg-white/10 text-white"
                    : "text-zinc-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-white/10 p-3">
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-400 transition hover:bg-red-950/60 hover:text-red-400"
          >
            <span className="text-base">↩</span>
            Выйти из консоли
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="ml-60 flex flex-1 flex-col bg-zinc-50 text-zinc-950">
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  )
}
