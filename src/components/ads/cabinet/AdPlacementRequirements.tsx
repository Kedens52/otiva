"use client"

import type { AdType } from "@prisma/client"
import {
  formatAllowedFormats,
  formatMaxSize,
  type CreativeRequirementsBundle,
} from "@/lib/ads/placement-requirements"

const DEVICE_LABELS = {
  ALL: "все устройства",
  MOBILE: "мобильные",
  DESKTOP: "десктоп",
} as const

type Props = {
  requirements: CreativeRequirementsBundle
  adType: AdType
  uploaded?: {
    width: number | null
    height: number | null
    mediaType: string
    sizeBytes: number | null
  }
}

export function AdPlacementRequirements({ requirements, adType, uploaded }: Props) {
  const { placements, primaryPlacement, sizeLabel, maxFileBytes, allowedFormats } = requirements

  const match =
    uploaded && primaryPlacement
      ? (() => {
          const w = uploaded.width
          const h = uploaded.height
          if (!w || !h || !primaryPlacement.designWidth || !primaryPlacement.designHeight) {
            return null
          }
          const ratioExpected = primaryPlacement.designWidth / primaryPlacement.designHeight
          const ratioActual = w / h
          const ratioDiff = Math.abs(ratioExpected - ratioActual) / ratioExpected
          if (ratioDiff > 0.35 || w < primaryPlacement.designWidth * 0.5) {
            return "warn" as const
          }
          return "ok" as const
        })()
      : null

  return (
    <div className="rounded-2xl border border-[hsl(var(--nashlo-orange)/0.2)] bg-[hsl(var(--nashlo-orange)/0.04)] p-4">
      <p className="text-sm font-semibold text-zinc-950">Требования к креативу</p>
      <p className="mt-1 text-xs text-zinc-600">
        Перед загрузкой проверьте размер и формат — иначе модерация может отклонить материал.
      </p>

      <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
        <div className="rounded-xl bg-white/80 px-3 py-2">
          <dt className="font-medium text-zinc-500">Рекомендуемый размер</dt>
          <dd className="mt-0.5 font-semibold text-zinc-900">{sizeLabel}</dd>
        </div>
        <div className="rounded-xl bg-white/80 px-3 py-2">
          <dt className="font-medium text-zinc-500">Форматы</dt>
          <dd className="mt-0.5 font-semibold text-zinc-900">{formatAllowedFormats(allowedFormats)}</dd>
        </div>
        <div className="rounded-xl bg-white/80 px-3 py-2">
          <dt className="font-medium text-zinc-500">Макс. вес</dt>
          <dd className="mt-0.5 font-semibold text-zinc-900">{formatMaxSize(maxFileBytes)}</dd>
        </div>
        <div className="rounded-xl bg-white/80 px-3 py-2">
          <dt className="font-medium text-zinc-500">Тип размещения</dt>
          <dd className="mt-0.5 font-semibold text-zinc-900">
            {adType === "BANNER" ? "Баннер" : "Карточка в ленте"}
          </dd>
        </div>
      </dl>

      {uploaded?.width && uploaded.height ? (
        <p
          className={`mt-3 rounded-xl px-3 py-2 text-xs font-medium ${
            match === "ok"
              ? "bg-emerald-50 text-emerald-800"
              : match === "warn"
                ? "bg-amber-50 text-amber-900"
                : "bg-zinc-100 text-zinc-700"
          }`}
        >
          Ваш файл: {uploaded.width}×{uploaded.height} px
          {uploaded.sizeBytes ? ` · ${formatMaxSize(uploaded.sizeBytes)}` : ""}
          {match === "ok" ? " — размер подходит" : null}
          {match === "warn"
            ? " — пропорции или разрешение могут не подойти для выбранного места"
            : null}
        </p>
      ) : null}

      {placements.length > 0 ? (
        <details className="mt-3">
          <summary className="cursor-pointer text-xs font-semibold text-zinc-700">
            Где будет показ ({placements.length})
          </summary>
          <ul className="mt-2 space-y-2">
            {placements.map((p) => (
              <li key={p.code} className="rounded-xl border border-white/80 bg-white/60 px-3 py-2 text-xs">
                <p className="font-semibold text-zinc-900">{p.name}</p>
                <p className="mt-0.5 text-zinc-500">{p.pages}</p>
                {p.whereOnPage ? (
                  <p className="mt-0.5 text-zinc-600">{p.whereOnPage}</p>
                ) : null}
                <p className="mt-0.5 text-zinc-600">
                  {DEVICE_LABELS[p.deviceScope as keyof typeof DEVICE_LABELS] ?? p.deviceScope}
                  {p.designWidth && p.designHeight
                    ? ` · ${p.designWidth}×${p.designHeight} px`
                    : null}
                </p>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  )
}
