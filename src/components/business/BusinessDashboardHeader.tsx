"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Plus, Search } from "lucide-react"
import { BusinessLogo } from "@/components/business/BusinessLogo"
import { useBusinessDashboard } from "@/components/business/BusinessDashboardContext"
import { PAGE_CONTAINER_CLASS } from "@/components/layout/PageContainer"

export function BusinessDashboardHeader() {
  const router = useRouter()
  const { permissions } = useBusinessDashboard()
  const [query, setQuery] = useState("")

  function onSearch(e: React.FormEvent) {
    e.preventDefault()
    const q = query.trim()
    router.push(q ? `/business/listings?q=${encodeURIComponent(q)}` : "/business/listings")
  }

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200/80 bg-white/95 backdrop-blur-md">
      <div className={`${PAGE_CONTAINER_CLASS} flex flex-wrap items-center gap-3 py-3`}>
        <BusinessLogo compact className="shrink-0" />

        <form onSubmit={onSearch} className="order-3 hidden min-w-0 flex-1 basis-full sm:order-none sm:flex sm:max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск по B2B"
              className="w-full rounded-xl border border-zinc-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-[hsl(var(--nashlo-orange))] focus:ring-2 focus:ring-[hsl(var(--nashlo-orange)/0.2)]"
            />
          </div>
        </form>

        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/"
            className="hidden rounded-xl border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-600 sm:inline-block"
          >
            Обычный Нашло
          </Link>
          <Link href="/profile" className="hidden rounded-xl px-3 py-2 text-xs font-semibold text-zinc-500 hover:text-zinc-800 sm:inline-block">
            Личный профиль
          </Link>
          {permissions.canManageListings && permissions.canPerformActions && (
            <Link
              href="/business/create"
              className="inline-flex items-center gap-1 rounded-xl bg-[hsl(var(--nashlo-orange))] px-3 py-2 text-sm font-semibold text-white"
            >
              <Plus className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">B2B-объявление</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
