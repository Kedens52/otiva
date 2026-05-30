"use client"

import Link from "next/link"
import { AdminTopBannerManager } from "@/components/admin/AdminTopBannerManager"
import { adSlots } from "@/lib/ad-store"

/** Единая точка: полоса над шапкой + ссылки на слоты ленты. */
export function AdminAllBannersPanel() {
  return (
    <div className="space-y-8">
      <AdminTopBannerManager />

      <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold tracking-tight text-zinc-950">Баннеры в ленте (слоты)</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Три зоны на главной: лидерборд в ленте и два блока в правой колонке (десктоп).
        </p>
        <ul className="mt-4 space-y-2 text-sm text-zinc-700">
          {adSlots.map((s) => (
            <li
              key={s.id}
              className="flex flex-wrap items-baseline justify-between gap-2 rounded-2xl bg-zinc-50 px-4 py-3"
            >
              <span className="font-semibold text-zinc-950">{s.label}</span>
              <span className="text-xs text-zinc-500">{s.size} · {s.page}</span>
            </li>
          ))}
        </ul>
        <Link
          href="/admin/ads"
          className="mt-5 inline-flex rounded-2xl bg-zinc-950 px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-800"
        >
          Настроить баннеры и предпросмотр
        </Link>
      </section>
    </div>
  )
}
