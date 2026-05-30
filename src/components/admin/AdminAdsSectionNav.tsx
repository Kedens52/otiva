"use client"

const SECTIONS = [
  { id: "placements", label: "Места" },
  { id: "map", label: "Карта" },
  { id: "site-strip-editor", label: "Полоса" },
  { id: "banner-editor", label: "Редактор" },
  { id: "banner-slots", label: "Список" },
  { id: "feed-campaigns", label: "В ленте" },
  { id: "moderation", label: "Модерация" },
] as const

export function AdminAdsSectionNav() {
  return (
    <nav
      aria-label="Разделы рекламы"
      className="sticky top-[calc(env(safe-area-inset-top)+3.75rem)] z-20 -mx-2 mb-6 flex gap-1.5 overflow-x-auto rounded-2xl border border-zinc-200 bg-white/95 px-2 py-2 shadow-sm backdrop-blur lg:top-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {SECTIONS.map((s) => (
        <a
          key={s.id}
          href={`#${s.id}`}
          className="shrink-0 rounded-xl px-3.5 py-2 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-950"
        >
          {s.label}
        </a>
      ))}
    </nav>
  )
}
