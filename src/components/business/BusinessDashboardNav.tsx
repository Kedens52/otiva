"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Building2,
  FileText,
  FolderOpen,
  LayoutDashboard,
  MessageCircle,
  Megaphone,
  Settings,
  Shield,
  ShoppingBag,
  Users,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { BUSINESS_NAV_ITEMS, canAccessSection } from "@/lib/business/permissions"
import { useBusinessDashboard } from "@/components/business/BusinessDashboardContext"

const ICONS = {
  overview: LayoutDashboard,
  company: Building2,
  listings: FileText,
  requests: ShoppingBag,
  messages: MessageCircle,
  ads: Megaphone,
  employees: Users,
  documents: FolderOpen,
  settings: Settings,
  security: Shield,
} as const

export function BusinessDashboardNav({ variant = "sidebar" }: { variant?: "sidebar" | "bottom" }) {
  const pathname = usePathname()
  const { role } = useBusinessDashboard()

  const items = BUSINESS_NAV_ITEMS.filter((item) => canAccessSection(role, item.section))

  const navClass =
    variant === "bottom"
      ? "fixed bottom-0 left-0 right-0 z-30 flex gap-0.5 overflow-x-auto border-t border-zinc-200 bg-white/95 px-2 py-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] shadow-[0_-6px_20px_rgba(15,23,42,0.08)] backdrop-blur-md lg:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      : "hidden flex-col gap-0.5 lg:flex"

  return (
    <nav className={navClass} aria-label="Меню бизнес-кабинета">
      {items.map(({ href, label, section, exact }) => {
        const Icon = ICONS[section]
        const active = exact ? pathname === href : pathname.startsWith(href)
        return (
          <Link
            key={`${section}-${href}`}
            href={href}
            className={cn(
              variant === "bottom"
                ? "flex min-w-[4.75rem] shrink-0 flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 text-[11px] font-medium"
                : "flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium",
              active
                ? variant === "bottom"
                  ? "text-[hsl(var(--nashlo-orange))]"
                  : "bg-zinc-950 text-white"
                : variant === "bottom"
                  ? "text-zinc-500"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950",
            )}
          >
            <Icon className={cn("shrink-0", variant === "bottom" ? "h-5 w-5" : "h-4 w-4")} aria-hidden />
            <span className={variant === "bottom" ? "truncate" : undefined}>{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
