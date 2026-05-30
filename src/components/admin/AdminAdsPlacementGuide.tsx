"use client"

import { useState } from "react"
import {
  BANNER_SLOT_GUIDE,
  CAMPAIGN_PLACEMENT_GROUPS,
  CAMPAIGN_PLACEMENT_GUIDE,
  PLACEMENT_ZONE_LABELS,
  SYSTEM_PLACEMENT_NOTES,
} from "@/lib/ads/placement-guide"

type AdminAdsPlacementGuideProps = {
  compact?: boolean
}

type CampaignRow = (typeof CAMPAIGN_PLACEMENT_GUIDE)[number]

function GuideTable({ rows }: { rows: CampaignRow[] }) {
  return (
    <>
      <div className="space-y-3 lg:hidden">
        {rows.map((row) => (
          <article key={row.value} className="rounded-2xl border border-zinc-200 bg-white p-4">
            <span className="inline-flex rounded-full bg-zinc-100 px-2.5 py-0.5 text-[11px] font-semibold text-zinc-700">
              {row.groupLabel}
            </span>
            <p className="mt-2 font-semibold text-zinc-900">{row.label}</p>
            <p className="mt-2 text-xs text-zinc-600">
              <span className="font-semibold text-zinc-400">Страницы: </span>
              {row.pages}
            </p>
            <p className="mt-1 text-xs text-zinc-600">
              <span className="font-semibold text-zinc-400">Где на экране: </span>
              {row.where}
            </p>
          </article>
        ))}
      </div>

      <div className="hidden overflow-x-auto rounded-2xl border border-zinc-200 lg:block">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-100 bg-zinc-50/80 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              <th className="px-4 py-3">Зона</th>
              <th className="px-4 py-3">Название</th>
              <th className="px-4 py-3">Страницы</th>
              <th className="px-4 py-3">Где на экране</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.value} className="border-b border-zinc-50 last:border-0">
                <td className="px-4 py-3 align-top">
                  <span className="inline-flex rounded-full bg-zinc-100 px-2.5 py-0.5 text-[11px] font-semibold text-zinc-700">
                    {row.groupLabel}
                  </span>
                </td>
                <td className="px-4 py-3 align-top font-semibold text-zinc-900">{row.label}</td>
                <td className="px-4 py-3 align-top text-zinc-600">{row.pages}</td>
                <td className="px-4 py-3 align-top text-zinc-600">{row.where}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

function BannerGuideTable({ rows }: { rows: (typeof BANNER_SLOT_GUIDE)[keyof typeof BANNER_SLOT_GUIDE][] }) {
  return (
    <>
      <div className="space-y-3 lg:hidden">
        {rows.map((row) => (
          <article key={row.id} className="rounded-2xl border border-zinc-200 bg-white p-4">
            <span className="inline-flex rounded-full bg-orange-50 px-2.5 py-0.5 text-[11px] font-semibold text-[hsl(var(--nashlo-orange))]">
              {row.zoneLabel}
            </span>
            <p className="mt-2 font-semibold text-zinc-900">{row.title}</p>
            <p className="mt-0.5 text-xs text-zinc-500">{row.adminHint}</p>
            <p className="mt-2 text-xs text-zinc-600">
              <span className="font-semibold text-zinc-400">Страницы: </span>
              {row.pages}
            </p>
            <p className="mt-1 text-xs text-zinc-600">
              <span className="font-semibold text-zinc-400">Где: </span>
              {row.where}
            </p>
            {row.size ? (
              <p className="mt-1 text-xs text-zinc-600">
                <span className="font-semibold text-zinc-400">Размер: </span>
                {row.size}
              </p>
            ) : null}
          </article>
        ))}
      </div>

      <div className="hidden overflow-x-auto rounded-2xl border border-zinc-200 lg:block">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-100 bg-zinc-50/80 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              <th className="px-4 py-3">Зона</th>
              <th className="px-4 py-3">Слот</th>
              <th className="px-4 py-3">Страницы</th>
              <th className="px-4 py-3">Где на экране</th>
              <th className="px-4 py-3">Размер</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-zinc-50 last:border-0">
                <td className="px-4 py-3 align-top">
                  <span className="inline-flex rounded-full bg-orange-50 px-2.5 py-0.5 text-[11px] font-semibold text-[hsl(var(--nashlo-orange))]">
                    {row.zoneLabel}
                  </span>
                </td>
                <td className="px-4 py-3 align-top">
                  <p className="font-semibold text-zinc-900">{row.title}</p>
                  <p className="mt-0.5 text-xs text-zinc-500">{row.adminHint}</p>
                </td>
                <td className="px-4 py-3 align-top text-zinc-600">{row.pages}</td>
                <td className="px-4 py-3 align-top text-zinc-600">{row.where}</td>
                <td className="px-4 py-3 align-top text-zinc-600">{row.size ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

export function AdminAdsPlacementGuide({ compact = false }: AdminAdsPlacementGuideProps) {
  const [open, setOpen] = useState(!compact)

  const bannerRows = Object.values(BANNER_SLOT_GUIDE)
  const campaignByGroup = CAMPAIGN_PLACEMENT_GROUPS.map((g) => ({
    ...g,
    items: CAMPAIGN_PLACEMENT_GUIDE.filter((p) => p.group === g.id),
  }))

  return (
    <section className="rounded-[28px] border border-zinc-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start justify-between gap-4 px-5 py-4 text-left"
      >
        <div>
          <p className="text-sm font-semibold text-[hsl(var(--nashlo-orange))]">Карта размещений</p>
          <h2 className="mt-0.5 text-lg font-semibold text-zinc-950">
            Где что показывается на сайте
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Ниже на этой странице — все разделы: баннеры, слоты главной и реклама в ленте объявлений.
          </p>
        </div>
        <span className="shrink-0 rounded-xl bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-600">
          {open ? "Свернуть" : "Развернуть"}
        </span>
      </button>

      {open ? (
        <div className="space-y-6 border-t border-zinc-100 px-5 pb-5 pt-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-amber-200/80 bg-amber-50/50 p-3">
              <p className="text-xs font-bold uppercase tracking-wide text-amber-800">Разделы 1–2</p>
              <p className="mt-1 text-sm text-amber-950/90">
                Полоса над шапкой и баннеры слотов на главной (мобильный, десктоп, сайдбар).
              </p>
            </div>
            <div className="rounded-2xl border border-sky-200/80 bg-sky-50/50 p-3">
              <p className="text-xs font-bold uppercase tracking-wide text-sky-800">Раздел 3</p>
              <p className="mt-1 text-sm text-sky-950/90">
                Карточки между объявлениями: главная, категории, поиск, страница товара.
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3 sm:col-span-2">
              <p className="text-xs font-bold uppercase tracking-wide text-zinc-600">Не настраивается здесь</p>
              <p className="mt-1 text-sm text-zinc-700">
                Полоска над нижним меню на телефоне — отдельный системный блок (код), не слоты и не кампании.
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-zinc-950">Баннеры и слоты</h3>
            <div className="mt-3">
              <BannerGuideTable rows={bannerRows} />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-zinc-950">Кампании в ленте объявлений</h3>
            <p className="mt-1 text-sm text-zinc-500">
              При создании кампании отметьте нужные размещения — карточка появится только там, где включён чекбокс.
            </p>
            <div className="mt-3 space-y-4">
              {campaignByGroup.map((group) => (
                <div key={group.id}>
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-zinc-500">
                    {group.label}
                  </p>
                  <GuideTable rows={group.items} />
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-zinc-500">Справочно: без админки</h3>
            <ul className="mt-2 space-y-2 text-sm text-zinc-600">
              {SYSTEM_PLACEMENT_NOTES.map((n) => (
                <li key={n.id} className="rounded-xl bg-zinc-50 px-3 py-2">
                  <span className="font-medium text-zinc-800">{n.title}</span>
                  {" — "}
                  {n.where}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </section>
  )
}
