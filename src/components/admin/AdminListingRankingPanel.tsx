"use client"

import { useCallback, useEffect, useState } from "react"
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader"
import { getAdminCsrfFromDocument } from "@/lib/admin/csrf-client"
import type { ListingScoreWeights } from "@/lib/listings/scoring/types"

type WeightSection = {
  key: keyof Omit<ListingScoreWeights, "promotionCapPercent" | "maxPromotedPageRatio">
  title: string
  labels: Record<string, string>
}

const SECTIONS: WeightSection[] = [
  {
    key: "relevance",
    title: "Релевантность",
    labels: {
      exactTitle: "Точное совпадение заголовка",
      brandModel: "Марка / модель",
      category: "Категория",
      subcategory: "Подкатегория",
      city: "Город",
      description: "Описание",
      attributes: "Атрибуты",
    },
  },
  {
    key: "quality",
    title: "Качество объявления",
    labels: {
      photos3Plus: "3+ фото",
      goodDescription: "Хорошее описание",
      hasPrice: "Цена указана",
      hasLocation: "Город / район",
      hasAttributes: "Атрибуты заполнены",
      recentPhotos: "Недавнее обновление фото",
    },
  },
  {
    key: "freshness",
    title: "Свежесть",
    labels: {
      today: "Создано сегодня",
      days3: "До 3 дней",
      days7: "До 7 дней",
      days14: "До 14 дней",
      days30: "До 30 дней",
    },
  },
  {
    key: "location",
    title: "Геолокация",
    labels: {
      sameDistrict: "Тот же район",
      sameCity: "Тот же город",
      sameRegion: "Тот же регион",
      nearbyRadius: "Рядом (радиус)",
    },
  },
  {
    key: "sellerTrust",
    title: "Доверие к продавцу",
    labels: {
      verifiedPhone: "Подтверждённый телефон",
      completeProfile: "Полный профиль",
      goodRating: "Хороший рейтинг",
      fastResponse: "Быстрый ответ",
      noComplaints: "Без жалоб",
      goodAccountAge: "Возраст аккаунта",
    },
  },
  {
    key: "promotion",
    title: "Продвижение (до cap)",
    labels: {
      highlighted: "Подсветка карточки",
      bump: "Поднятие",
      recommendation: "Рекомендация",
      premium: "Премиум",
      pinned: "Закрепление",
      turbo: "Турбо",
    },
  },
  {
    key: "penalty",
    title: "Штрафы",
    labels: {
      incomplete: "Неполное объявление",
      noPhotos: "Нет фото",
      complaints: "Жалобы",
      spamSuspicion: "Подозрение на спам",
      duplicate: "Дубликат",
      forbidden: "Запрещённый товар",
      fraudSuspicion: "Подозрение на мошенничество",
    },
  },
]

export function AdminListingRankingPanel() {
  const [weights, setWeights] = useState<ListingScoreWeights | null>(null)
  const [defaults, setDefaults] = useState<ListingScoreWeights | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/admin/listing-scoring")
      if (!res.ok) throw new Error("Не удалось загрузить веса")
      const data = await res.json()
      setWeights(data.weights)
      setDefaults(data.defaults)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка загрузки")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  function setNested(
    section: WeightSection["key"],
    field: string,
    value: number,
  ) {
    if (!weights) return
    setWeights({
      ...weights,
      [section]: {
        ...(weights[section] as Record<string, number>),
        [field]: value,
      },
    })
    setMessage(null)
  }

  async function save() {
    if (!weights) return
    setSaving(true)
    setError(null)
    setMessage(null)
    try {
      const res = await fetch("/api/admin/listing-scoring", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": getAdminCsrfFromDocument(),
        },
        body: JSON.stringify(weights),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? "Ошибка сохранения")
      }
      const data = await res.json()
      setWeights(data.weights)
      setMessage("Веса сохранены. Новая выдача использует обновлённые коэффициенты.")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка сохранения")
    } finally {
      setSaving(false)
    }
  }

  function resetToDefaults() {
    if (defaults) setWeights(structuredClone(defaults))
    setMessage(null)
  }

  if (loading) {
    return <p className="text-sm text-zinc-500">Загрузка весов ранжирования…</p>
  }

  if (!weights) {
    return <p className="text-sm text-red-600">{error ?? "Нет данных"}</p>
  }

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Ранжирование объявлений"
        description={
          <>
            Честная формула: релевантность и качество важнее оплаты. Продвижение ограничено долей от органического
            скора ({weights.promotionCapPercent}%) и не более {Math.round(weights.maxPromotedPageRatio * 100)}%
            карточек на первой странице.
          </>
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={resetToDefaults}
              className="rounded-2xl border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
            >
              Сбросить к умолчанию
            </button>
            <button
              type="button"
              onClick={() => void save()}
              disabled={saving}
              className="rounded-2xl bg-zinc-950 px-6 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
            >
              {saving ? "Сохраняем…" : "Сохранить"}
            </button>
          </div>
        }
      />

      {error && <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
      {message && (
        <p className="rounded-2xl bg-[hsl(var(--nashlo-mint)/0.12)] px-4 py-3 text-sm text-[hsl(var(--nashlo-mint))]">
          {message}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="rounded-[20px] border border-zinc-200 bg-white p-4">
          <span className="text-sm font-medium text-zinc-700">Потолок продвижения (% от organic)</span>
          <input
            type="number"
            min={0}
            max={50}
            value={weights.promotionCapPercent}
            onChange={(e) =>
              setWeights({ ...weights, promotionCapPercent: Number(e.target.value) })
            }
            className="mt-2 h-11 w-full rounded-2xl border border-zinc-200 px-4 text-sm"
          />
        </label>
        <label className="rounded-[20px] border border-zinc-200 bg-white p-4">
          <span className="text-sm font-medium text-zinc-700">Доля продвигаемых на 1-й странице (0–0.6)</span>
          <input
            type="number"
            min={0}
            max={0.6}
            step={0.05}
            value={weights.maxPromotedPageRatio}
            onChange={(e) =>
              setWeights({ ...weights, maxPromotedPageRatio: Number(e.target.value) })
            }
            className="mt-2 h-11 w-full rounded-2xl border border-zinc-200 px-4 text-sm"
          />
        </label>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {SECTIONS.map((section) => (
          <section
            key={section.key}
            className="overflow-hidden rounded-[24px] border border-zinc-200 bg-white shadow-sm"
          >
            <h2 className="border-b border-zinc-100 px-5 py-4 text-lg font-semibold text-zinc-950">
              {section.title}
            </h2>
            <div className="divide-y divide-zinc-100">
              {Object.entries(section.labels).map(([field, label]) => (
                <label
                  key={field}
                  className="flex items-center justify-between gap-4 px-5 py-3 text-sm"
                >
                  <span className="text-zinc-600">{label}</span>
                  <input
                    type="number"
                    value={(weights[section.key] as Record<string, number>)[field] ?? 0}
                    onChange={(e) => setNested(section.key, field, Number(e.target.value))}
                    className="h-9 w-24 rounded-xl border border-zinc-200 px-2 text-right font-mono text-sm"
                  />
                </label>
              ))}
            </div>
          </section>
        ))}
      </div>

      <p className="text-xs text-zinc-400">
        Логи позиций: переменная LISTING_RANKING_LOG=1 или параметр explainRanking=1 в API (только для админ-сессии).
      </p>
    </div>
  )
}
