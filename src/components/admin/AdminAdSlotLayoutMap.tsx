"use client"

import { adSlots, type AdSlotId } from "@/lib/ad-store"

type AdminAdSlotLayoutMapProps = {
  selectedSlot: AdSlotId
  onSelectSlot: (slot: AdSlotId) => void
  activeBySlot: Record<AdSlotId, number>
}

function slotMeta(id: AdSlotId) {
  return adSlots.find((s) => s.id === id)!
}

export function AdminAdSlotLayoutMap({
  selectedSlot,
  onSelectSlot,
  activeBySlot,
}: AdminAdSlotLayoutMapProps) {
  const slotClass = (id: AdSlotId) => {
    const selected = selectedSlot === id
    const active = activeBySlot[id] > 0
    return [
      "relative rounded-xl border-2 border-dashed px-2 py-2 text-left transition",
      selected
        ? "border-[hsl(var(--nashlo-orange))] bg-[hsl(var(--nashlo-orange)/0.08)] ring-2 ring-[hsl(var(--nashlo-orange)/0.25)]"
        : "border-zinc-300 bg-white/80 hover:border-zinc-400",
      active && !selected ? "border-emerald-400 bg-emerald-50/50" : "",
    ].join(" ")
  }

  const liveBadge = (id: AdSlotId, className = "absolute right-2 top-2") =>
    activeBySlot[id] > 0 ? (
      <span
        className={`${className} rounded-full bg-emerald-500 px-1.5 py-0.5 text-[9px] font-bold text-white`}
      >
        LIVE
      </span>
    ) : null

  return (
    <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[hsl(var(--nashlo-orange))]">Схема страницы</p>
          <h2 className="mt-1 text-xl font-semibold text-zinc-950">Куда попадает баннер</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Нажмите на зону — откроется настройка и предпросмотр для этого слота.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-zinc-500">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
            есть активная реклама
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[hsl(var(--nashlo-orange))]" />
            выбранный слот
          </span>
        </div>
      </div>

      <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-zinc-500">Главная / лента</p>
      <div className="mt-2 overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 p-3">
        <div className="mb-2 flex h-7 items-center justify-center rounded-lg bg-gradient-to-r from-lime-200 to-sky-200 text-[10px] font-semibold text-zinc-700">
          Полоса над шапкой — отдельный блок ниже ↓
        </div>

        <div className="mb-2 h-8 rounded-lg bg-white shadow-sm" />

        <div className="grid gap-2 lg:grid-cols-[minmax(0,1fr)_140px]">
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-1.5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 rounded-lg bg-white shadow-sm" />
              ))}
            </div>

            <button
              type="button"
              onClick={() => onSelectSlot("mobileLeaderboard")}
              className={`w-full ${slotClass("mobileLeaderboard")}`}
            >
              <p className="text-[10px] font-bold uppercase tracking-wide text-[hsl(var(--nashlo-orange))]">
                Мобильный · {slotMeta("mobileLeaderboard").size}
              </p>
              <p className="mt-0.5 text-xs font-semibold text-zinc-800">{slotMeta("mobileLeaderboard").label}</p>
              {liveBadge("mobileLeaderboard")}
            </button>

            <button type="button" onClick={() => onSelectSlot("leaderboard")} className={`w-full ${slotClass("leaderboard")}`}>
              <p className="text-[10px] font-bold uppercase tracking-wide text-[hsl(var(--nashlo-orange))]">
                {slotMeta("leaderboard").shortLabel} · {slotMeta("leaderboard").size}
              </p>
              <p className="mt-0.5 text-xs font-semibold text-zinc-800">{slotMeta("leaderboard").label}</p>
              {liveBadge("leaderboard")}
            </button>

            <div className="grid grid-cols-2 gap-1.5">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-12 rounded-lg bg-white shadow-sm" />
              ))}
            </div>
          </div>

          <div className="hidden space-y-2 lg:block">
            <button type="button" onClick={() => onSelectSlot("sidebarTop")} className={`h-[72px] w-full ${slotClass("sidebarTop")}`}>
              <p className="text-[9px] font-bold uppercase text-[hsl(var(--nashlo-blue))]">{slotMeta("sidebarTop").size}</p>
              <p className="text-[11px] font-semibold leading-tight text-zinc-800">{slotMeta("sidebarTop").shortLabel}</p>
              {liveBadge("sidebarTop", "absolute right-1.5 top-1.5")}
            </button>
            <button type="button" onClick={() => onSelectSlot("sidebarTall")} className={`h-[120px] w-full ${slotClass("sidebarTall")}`}>
              <p className="text-[9px] font-bold uppercase text-[hsl(var(--nashlo-blue))]">{slotMeta("sidebarTall").size}</p>
              <p className="text-[11px] font-semibold leading-tight text-zinc-800">{slotMeta("sidebarTall").shortLabel}</p>
              {liveBadge("sidebarTall", "absolute right-1.5 top-1.5")}
            </button>
          </div>
        </div>

        <div className="mt-2 grid gap-2 lg:hidden">
          {adSlots
            .filter((s) => s.id === "mobileLeaderboard" || s.id.startsWith("sidebar"))
            .map((slot) => (
              <button key={slot.id} type="button" onClick={() => onSelectSlot(slot.id)} className={slotClass(slot.id)}>
                <p className="text-[10px] font-bold uppercase text-[hsl(var(--nashlo-blue))]">{slot.size}</p>
                <p className="text-xs font-semibold text-zinc-800">{slot.label}</p>
              </button>
            ))}
        </div>
      </div>

      <p className="mt-6 text-xs font-semibold uppercase tracking-wide text-zinc-500">Страница объявления</p>
      <div className="mt-2 overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 p-3">
        <div className="grid gap-2 lg:grid-cols-[minmax(0,1fr)_140px]">
          <div className="space-y-2">
            <div className="h-24 rounded-lg bg-white shadow-sm" />
            <div className="h-16 rounded-lg bg-white shadow-sm" />
            <div className="h-20 rounded-lg bg-white/60" />
          </div>
          <div className="hidden space-y-2 lg:block">
            <div className="rounded-xl border border-zinc-200 bg-white px-2 py-3 shadow-sm">
              <div className="h-3 w-2/3 rounded bg-zinc-100" />
              <div className="mt-2 h-5 w-1/2 rounded bg-zinc-200" />
              <div className="mt-3 h-14 rounded-lg bg-zinc-50" />
              <div className="mt-2 grid gap-1">
                <div className="h-6 rounded-md bg-zinc-100" />
                <div className="h-6 rounded-md bg-zinc-100" />
              </div>
            </div>
            <button
              type="button"
              onClick={() => onSelectSlot("listingSidebar")}
              className={`h-[52px] w-full ${slotClass("listingSidebar")}`}
            >
              <p className="text-[9px] font-bold uppercase text-[hsl(var(--nashlo-orange))]">
                {slotMeta("listingSidebar").size}
              </p>
              <p className="text-[11px] font-semibold leading-tight text-zinc-800">{slotMeta("listingSidebar").shortLabel}</p>
              {liveBadge("listingSidebar", "absolute right-1.5 top-1.5")}
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onSelectSlot("listingSidebar")}
          className={`mt-2 w-full lg:hidden ${slotClass("listingSidebar")}`}
        >
          <p className="text-[10px] font-bold uppercase text-[hsl(var(--nashlo-orange))]">{slotMeta("listingSidebar").size}</p>
          <p className="text-xs font-semibold text-zinc-800">{slotMeta("listingSidebar").label}</p>
        </button>
      </div>
    </section>
  )
}
