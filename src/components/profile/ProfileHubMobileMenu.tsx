import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { CABINET_NAV_SECTIONS } from "@/config/cabinet-nav"
import { profileHubMenuIcon, type ProfileHubMenuRow } from "@/components/profile/profile-hub-menu"

type ProfileHubMobileMenuProps = {
  unreadChats: number
  extras?: ProfileHubMenuRow[]
}

function MenuRow({ item, unreadChats }: { item: ProfileHubMenuRow; unreadChats: number }) {
  const Icon = profileHubMenuIcon(item.href)
  const showBadge = item.badge && unreadChats > 0

  return (
    <Link
      href={item.href}
      className={`flex items-center gap-3 px-4 py-3.5 transition active:bg-zinc-50 ${
        item.accent ? "bg-gradient-to-r from-[#FFF6F0]/80 to-white" : ""
      }`}
    >
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
          item.accent
            ? "bg-[hsl(var(--nashlo-orange))] text-white"
            : "bg-zinc-100 text-zinc-700"
        }`}
      >
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-semibold leading-tight text-zinc-950">{item.label}</p>
        {item.subtitle ? <p className="mt-0.5 text-sm text-zinc-500">{item.subtitle}</p> : null}
      </div>
      {showBadge ? (
        <span className="shrink-0 rounded-full bg-[hsl(var(--nashlo-orange))] px-2 py-0.5 text-[11px] font-bold text-white">
          {unreadChats > 99 ? "99+" : unreadChats}
        </span>
      ) : (
        <ChevronRight className="h-5 w-5 shrink-0 text-zinc-300" strokeWidth={1.75} />
      )}
    </Link>
  )
}

export function ProfileHubMobileMenu({ unreadChats, extras = [] }: ProfileHubMobileMenuProps) {
  return (
    <div className="space-y-3 lg:hidden">
      {CABINET_NAV_SECTIONS.map((section) => (
        <section
          key={section.title ?? "main"}
          className="overflow-hidden rounded-[20px] bg-white shadow-[0_2px_12px_rgba(15,23,42,0.05)]"
        >
          {section.title ? (
            <p className="border-b border-zinc-100 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">
              {section.title}
            </p>
          ) : null}
          <div className="divide-y divide-zinc-100">
            {section.items
              .filter((item) => item.href !== "/profile")
              .map((item) => (
              <MenuRow
                key={item.href}
                item={{
                  ...item,
                  badge: item.badge,
                  subtitle: item.subtitle,
                }}
                unreadChats={unreadChats}
              />
            ))}
          </div>
        </section>
      ))}

      {extras.length > 0 ? (
        <section className="overflow-hidden rounded-[20px] bg-white shadow-[0_2px_12px_rgba(15,23,42,0.05)] divide-y divide-zinc-100">
          {extras.map((item) => (
            <MenuRow key={item.href} item={item} unreadChats={unreadChats} />
          ))}
        </section>
      ) : null}
    </div>
  )
}
