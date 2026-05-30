"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import type { AdPlacementKind } from "@prisma/client"
import { getAdminCsrfFromDocument } from "@/lib/admin/csrf-client"
import type { PlacementConfigDto } from "@/lib/ads/placement-config-service"

const KIND_LABELS: Record<AdPlacementKind, string> = {
  BANNER_SLOT: "Баннер-слот",
  CAMPAIGN: "В ленте / кампания",
  SITE_STRIP: "Полоса над шапкой",
}

const DEVICE_LABELS = {
  ALL: "Все",
  MOBILE: "Мобильный",
  DESKTOP: "Десктоп",
} as const

function formatRub(value: number | null) {
  if (value == null || value <= 0) return "—"
  return `${value.toLocaleString("ru-RU")} ₽`
}

function formatSize(row: PlacementConfigDto) {
  if (row.designWidth && row.designHeight) {
    return `${row.designWidth}×${row.designHeight}`
  }
  return "—"
}

export function AdminAdPlacementsPanel() {
  const [rows, setRows] = useState<PlacementConfigDto[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [filter, setFilter] = useState<"all" | AdPlacementKind>("all")

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch("/api/admin/ad-placements")
    if (res.ok) {
      const data = await res.json()
      setRows(data.placements ?? [])
    } else {
      setMessage("Не удалось загрузить рекламные места.")
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const filtered = useMemo(() => {
    if (filter === "all") return rows
    return rows.filter((r) => r.kind === filter)
  }, [filter, rows])

  function patch(id: string, patch: Partial<PlacementConfigDto>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
    setMessage("")
  }

  async function save() {
    setSaving(true)
    setMessage("")
    const res = await fetch("/api/admin/ad-placements", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": getAdminCsrfFromDocument(),
      },
      body: JSON.stringify({ placements: rows }),
    })
    const data = await res.json().catch(() => ({}))
    setSaving(false)
    if (!res.ok) {
      setMessage(data.error || "Не удалось сохранить")
      return
    }
    setRows(data.placements ?? rows)
    setMessage("Настройки рекламных мест сохранены.")
  }

  return (
    <section id="placements" className="scroll-mt-24">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[hsl(var(--nashlo-orange))]">Раздел 0</p>
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-950">Рекламные места и цены</h2>
          <p className="mt-1 max-w-2xl text-sm text-zinc-500">
            Единый справочник: баннеры на главной, полоса над шапкой и слоты в лентах. Код места не меняется — так
            подключены блоки на сайте.
          </p>
        </div>
        <button
          type="button"
          disabled={saving || loading}
          onClick={() => void save()}
          className="rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {saving ? "Сохранение…" : "Сохранить все"}
        </button>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {(
          [
            ["all", "Все"],
            ["BANNER_SLOT", "Баннеры"],
            ["SITE_STRIP", "Полоса"],
            ["CAMPAIGN", "В ленте"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
              filter === key ? "bg-zinc-950 text-white" : "bg-zinc-100 text-zinc-600"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {message ? (
        <p className="mb-4 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm text-zinc-700">{message}</p>
      ) : null}

      {loading ? (
        <p className="text-sm text-zinc-500">Загрузка…</p>
      ) : (
        <>
          <div className="grid gap-3 lg:hidden">
            {filtered.map((row) => (
              <div key={row.id} className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-mono text-[11px] text-zinc-500">{row.code}</p>
                    <p className="mt-1 text-xs text-zinc-500">{KIND_LABELS[row.kind]} · {DEVICE_LABELS[row.deviceScope]}</p>
                  </div>
                  <label className="flex items-center gap-2 rounded-full bg-zinc-50 px-3 py-1.5 text-xs font-semibold text-zinc-600">
                    <input
                      type="checkbox"
                      checked={row.active}
                      onChange={(e) => patch(row.id, { active: e.target.checked })}
                    />
                    {row.active ? "Активно" : "Выкл"}
                  </label>
                </div>

                <div className="mt-3 grid gap-3">
                  <label className="grid gap-1">
                    <span className="text-xs font-semibold text-zinc-500">Название</span>
                    <input
                      value={row.name}
                      onChange={(e) => patch(row.id, { name: e.target.value })}
                      className="h-10 rounded-xl border border-zinc-200 px-3 text-sm font-semibold"
                    />
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    <label className="grid gap-1">
                      <span className="text-xs font-semibold text-zinc-500">Устройство</span>
                      <select
                        value={row.deviceScope}
                        onChange={(e) =>
                          patch(row.id, {
                            deviceScope: e.target.value as PlacementConfigDto["deviceScope"],
                          })
                        }
                        className="h-10 rounded-xl border border-zinc-200 px-3 text-sm"
                      >
                        {Object.entries(DEVICE_LABELS).map(([v, l]) => (
                          <option key={v} value={v}>
                            {l}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="grid gap-1">
                      <span className="text-xs font-semibold text-zinc-500">Лимит баннеров</span>
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={row.maxActiveCreatives}
                        onChange={(e) =>
                          patch(row.id, { maxActiveCreatives: Number(e.target.value) || 1 })
                        }
                        className="h-10 rounded-xl border border-zinc-200 px-3 text-sm"
                      />
                    </label>
                  </div>

                  <div className="rounded-xl bg-zinc-50 px-3 py-2 text-xs text-zinc-600">
                    Размер: <span className="font-semibold text-zinc-900">{formatSize(row)}</span>
                    <p className="mt-1 line-clamp-2 text-zinc-500">{row.pages}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {([
                      ["pricePerMinute", "Мин"],
                      ["pricePerHour", "Час"],
                      ["pricePerDay", "День"],
                      ["pricePerWeek", "Неделя"],
                    ] as const).map(([key, label]) => (
                      <label key={key} className="grid gap-1">
                        <span className="text-xs font-semibold text-zinc-500">{label}</span>
                        <input
                          type="number"
                          min={0}
                          value={row[key] ?? ""}
                          onChange={(e) =>
                            patch(row.id, {
                              [key]: e.target.value === "" ? null : Number(e.target.value),
                            })
                          }
                          placeholder="—"
                          className="h-10 rounded-xl border border-zinc-200 px-3 text-sm"
                        />
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-sm lg:block">
            <table className="w-full min-w-[1100px] text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50/80 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  <th className="px-3 py-3">Код</th>
                  <th className="px-3 py-3">Название</th>
                  <th className="px-3 py-3">Тип</th>
                  <th className="px-3 py-3">Устройство</th>
                  <th className="px-3 py-3">Размер</th>
                  <th className="px-3 py-3">Лимит баннеров</th>
                  <th className="px-3 py-3">Цена / мин</th>
                  <th className="px-3 py-3">Час</th>
                  <th className="px-3 py-3">День</th>
                  <th className="px-3 py-3">Неделя</th>
                  <th className="px-3 py-3">Активно</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.id} className="border-b border-zinc-50 align-top last:border-0">
                    <td className="px-3 py-3 font-mono text-xs text-zinc-600">{row.code}</td>
                    <td className="px-3 py-3">
                      <input
                        value={row.name}
                        onChange={(e) => patch(row.id, { name: e.target.value })}
                        className="mb-1 w-full min-w-[140px] rounded-lg border border-zinc-200 px-2 py-1.5 text-sm font-semibold"
                      />
                      <p className="text-xs text-zinc-500 line-clamp-2">{row.pages}</p>
                    </td>
                    <td className="px-3 py-3 text-xs text-zinc-600">{KIND_LABELS[row.kind]}</td>
                    <td className="px-3 py-3">
                      <select
                        value={row.deviceScope}
                        onChange={(e) =>
                          patch(row.id, {
                            deviceScope: e.target.value as PlacementConfigDto["deviceScope"],
                          })
                        }
                        className="rounded-lg border border-zinc-200 px-2 py-1.5 text-xs"
                      >
                        {Object.entries(DEVICE_LABELS).map(([v, l]) => (
                          <option key={v} value={v}>
                            {l}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-3 text-xs text-zinc-600">{formatSize(row)}</td>
                    <td className="px-3 py-3">
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={row.maxActiveCreatives}
                        onChange={(e) =>
                          patch(row.id, { maxActiveCreatives: Number(e.target.value) || 1 })
                        }
                        className="w-16 rounded-lg border border-zinc-200 px-2 py-1.5 text-xs"
                      />
                    </td>
                    {(["pricePerMinute", "pricePerHour", "pricePerDay", "pricePerWeek"] as const).map((key) => (
                      <td key={key} className="px-3 py-3">
                        <input
                          type="number"
                          min={0}
                          value={row[key] ?? ""}
                          onChange={(e) =>
                            patch(row.id, {
                              [key]: e.target.value === "" ? null : Number(e.target.value),
                            })
                          }
                          placeholder="—"
                          className="w-20 rounded-lg border border-zinc-200 px-2 py-1.5 text-xs"
                        />
                        <p className="mt-0.5 text-[10px] text-zinc-400">{formatRub(row[key])}</p>
                      </td>
                    ))}
                    <td className="px-3 py-3">
                      <label className="flex items-center gap-2 text-xs">
                        <input
                          type="checkbox"
                          checked={row.active}
                          onChange={(e) => patch(row.id, { active: e.target.checked })}
                        />
                        {row.active ? "Да" : "Нет"}
                      </label>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <details className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-50/50 p-4">
        <summary className="cursor-pointer text-sm font-semibold text-zinc-800">
          Fallback и форматы (выбранное место)
        </summary>
        <p className="mt-2 text-xs text-zinc-500">
          Разверните строку в таблице выше по коду — ниже редактируются все места подряд компактными блоками.
        </p>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {filtered.map((row) => (
            <div key={`fb-${row.id}`} className="rounded-xl border border-zinc-200 bg-white p-4">
              <p className="font-mono text-xs text-zinc-500">{row.code}</p>
              <p className="font-semibold text-zinc-900">{row.name}</p>
              <div className="mt-3 grid gap-2">
                <input
                  value={row.fallbackTitle ?? ""}
                  onChange={(e) => patch(row.id, { fallbackTitle: e.target.value || null })}
                  placeholder="Заголовок fallback"
                  className="h-9 w-full rounded-lg border border-zinc-200 px-2 text-sm"
                />
                <input
                  value={row.fallbackSubtitle ?? ""}
                  onChange={(e) => patch(row.id, { fallbackSubtitle: e.target.value || null })}
                  placeholder="Подзаголовок"
                  className="h-9 w-full rounded-lg border border-zinc-200 px-2 text-sm"
                />
                <div className="flex gap-2">
                  <input
                    value={row.fallbackCta ?? ""}
                    onChange={(e) => patch(row.id, { fallbackCta: e.target.value || null })}
                    placeholder="Кнопка"
                    className="h-9 flex-1 rounded-lg border border-zinc-200 px-2 text-sm"
                  />
                  <input
                    value={row.fallbackHref ?? ""}
                    onChange={(e) => patch(row.id, { fallbackHref: e.target.value || null })}
                    placeholder="/advertising"
                    className="h-9 flex-1 rounded-lg border border-zinc-200 px-2 text-sm"
                  />
                </div>
                <input
                  value={row.allowedFormats.join(", ")}
                  onChange={(e) =>
                    patch(row.id, {
                      allowedFormats: e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                  placeholder="image/jpeg, image/png, …"
                  className="h-9 w-full rounded-lg border border-zinc-200 px-2 text-xs"
                />
                <input
                  type="number"
                  value={row.maxFileBytes ?? ""}
                  onChange={(e) =>
                    patch(row.id, {
                      maxFileBytes: e.target.value === "" ? null : Number(e.target.value),
                    })
                  }
                  placeholder="Макс. вес файла, байт"
                  className="h-9 w-full rounded-lg border border-zinc-200 px-2 text-xs"
                />
              </div>
            </div>
          ))}
        </div>
      </details>
    </section>
  )
}
