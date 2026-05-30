"use client"

import { useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Check, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { WantToBuyCategoryPicker } from "@/components/want-to-buy/WantToBuyCategoryPicker"
import { WantToBuyCityField } from "@/components/want-to-buy/WantToBuyCityField"
import type { WantToBuyCategoryOption } from "@/lib/want-to-buy/client-types"
import { getWantToBuyCreatePath, getWantToBuyDetailPath, getWantToBuyHubPath } from "@/lib/want-to-buy/routes"
import {
  formatWantToBuyPriceMax,
  wantToBuyConditionLabel,
} from "@/lib/want-to-buy/labels"
import { getWantToBuyCategoryTitle, sortWantToBuyCategories } from "@/lib/want-to-buy/category-display"
import { getStoredCity, isCityFilterActive } from "@/lib/city-selection"
import { cn } from "@/lib/utils"

function initialWantToBuyCity(): string {
  if (typeof window === "undefined") return ""
  const stored = getStoredCity()
  return isCityFilterActive(stored) ? stored : ""
}

const STEPS = ["Категория", "Описание", "Параметры", "Публикация"] as const

const CONDITION_OPTIONS = [
  { value: "NEW", label: "Новый" },
  { value: "USED", label: "Б/у" },
  { value: "ANY", label: "Любое" },
] as const

type WantToBuyFormProps = {
  categories: WantToBuyCategoryOption[]
}

export function WantToBuyForm({ categories }: WantToBuyFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const presetCategory = searchParams.get("category") ?? ""
  const sortedCategories = useMemo(
    () => sortWantToBuyCategories(categories),
    [categories],
  )
  const [step, setStep] = useState(
    presetCategory && sortedCategories.some((c) => c.slug === presetCategory) ? 1 : 0,
  )
  const [categorySlug, setCategorySlug] = useState(
    sortedCategories.some((c) => c.slug === presetCategory) ? presetCategory : "",
  )
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [priceMax, setPriceMax] = useState("")
  const [city, setCity] = useState(initialWantToBuyCity)
  const [condition, setCondition] = useState<"NEW" | "USED" | "ANY">("ANY")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const categoryRow = sortedCategories.find((c) => c.slug === categorySlug)
  const categoryLabel = categoryRow
    ? getWantToBuyCategoryTitle(categoryRow.slug, categoryRow.nameRu)
    : "—"

  function canNext(): boolean {
    if (step === 0) return Boolean(categorySlug)
    if (step === 1) return title.trim().length >= 3
    if (step === 2) return Boolean(city.trim())
    return true
  }

  async function publish() {
    setError(null)
    const priceParsed =
      priceMax.trim() === ""
        ? null
        : Number.parseInt(priceMax.replace(/\s/g, ""), 10)
    if (priceParsed != null && (!Number.isFinite(priceParsed) || priceParsed < 0)) {
      setError("Укажите корректный бюджет")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/want-to-buy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          categorySlug,
          priceMax: priceParsed,
          city: city.trim(),
          condition,
        }),
      })
      const data = (await res.json()) as {
        error?: string
        item?: { id: string; category?: { slug: string } }
        moderation?: { status: string; reason: string | null }
      }
      if (res.status === 401) {
        router.push(`/login?return=${encodeURIComponent(getWantToBuyCreatePath())}`)
        return
      }
      if (!res.ok) {
        setError(data.error ?? "Не удалось создать заявку")
        return
      }
      if (data.item?.id) {
        if (data.item.category?.slug) {
          router.push(
            getWantToBuyDetailPath({
              id: data.item.id,
              categorySlug: data.item.category.slug,
            }),
          )
        } else {
          router.push(getWantToBuyHubPath())
        }
        router.refresh()
      }
    } catch {
      setError("Ошибка сети")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 flex gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex flex-1 flex-col items-center gap-2">
            <div
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold",
                i < step && "bg-[hsl(var(--nashlo-orange))] text-white",
                i === step && "bg-[#000000] text-white",
                i > step && "bg-zinc-200 text-zinc-500",
              )}
            >
              {i < step ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            <span className="hidden text-center text-[11px] font-medium text-[#4B4B4B] sm:block">
              {label}
            </span>
          </div>
        ))}
      </div>

      <div className="rounded-[18px] border border-[rgba(15,23,42,0.06)] bg-white p-6 shadow-sm sm:p-8">
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-[#000000]">Категория</h2>
            <p className="text-sm text-[#4B4B4B]">
              Выберите раздел — так продавцы быстрее найдут вашу заявку.
            </p>
            <WantToBuyCategoryPicker
              categories={sortedCategories}
              value={categorySlug}
              onChange={setCategorySlug}
            />
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#FF5A00]">
              {categoryLabel}
            </p>
            <h2 className="text-xl font-bold text-[#000000]">Что ищете</h2>
            <p className="text-sm text-[#4B4B4B]">
              Напишите чётко: модель, цвет, размер — например «iPhone 14 Pro 256GB, синий».
            </p>
            <div className="space-y-2">
              <Label htmlFor="wtb-title">Заголовок</Label>
              <Input
                id="wtb-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ищу iPhone 14 Pro, синий"
                maxLength={100}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wtb-desc">Описание</Label>
              <Textarea
                id="wtb-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Состояние, комплектация, срочность, район…"
                rows={5}
                maxLength={3000}
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-[#000000]">Параметры</h2>
            <p className="text-sm text-[#4B4B4B]">
              Бюджет и город помогут получать подходящие предложения.
            </p>
            <div className="space-y-2">
              <Label htmlFor="wtb-price">Максимальная цена, ₽</Label>
              <Input
                id="wtb-price"
                inputMode="numeric"
                value={priceMax}
                onChange={(e) => setPriceMax(e.target.value)}
                placeholder="Не указан — любой бюджет"
              />
            </div>
            <WantToBuyCityField
              value={city}
              onChange={setCity}
              useStoredCityDefault
              label="Город"
            />
            <div className="space-y-2">
              <Label>Состояние товара</Label>
              <Select value={condition} onValueChange={(v) => setCondition(v as typeof condition)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONDITION_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-[#4B4B4B]">
              Заявка активна 30 дней, потом её можно продлить.
            </p>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-[#000000]">Превью и публикация</h2>
            <div className="rounded-[14px] bg-[#ECECEC]/80 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#4B4B4B]">
                {categoryLabel}
              </p>
              <h3 className="mt-2 text-lg font-bold text-[#000000]">{title || "—"}</h3>
              {description ? (
                <p className="mt-2 text-sm text-[#4B4B4B]">{description}</p>
              ) : null}
              <div className="mt-4 flex flex-wrap gap-3 text-sm text-[#4B4B4B]">
                <span className="font-semibold text-[#000000]">
                  {priceMax.trim()
                    ? formatWantToBuyPriceMax(Number.parseInt(priceMax.replace(/\s/g, ""), 10))
                    : formatWantToBuyPriceMax(null)}
                </span>
                {city.trim() ? <span>{city.trim()}</span> : null}
                <span>{wantToBuyConditionLabel(condition)}</span>
              </div>
            </div>
            <p className="text-sm text-[#4B4B4B]">
              Контакты не показываются публично. Продавцы откликнутся через Нашло.
            </p>
          </div>
        )}

        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
          {step > 0 ? (
            <Button type="button" variant="outline" onClick={() => setStep((s) => s - 1)}>
              <ChevronLeft className="mr-1 h-4 w-4" />
              Назад
            </Button>
          ) : (
            <Button type="button" variant="ghost" asChild>
              <Link href={getWantToBuyHubPath()}>Отмена</Link>
            </Button>
          )}

          {step < 3 ? (
            <Button
              type="button"
              disabled={!canNext()}
              onClick={() => setStep((s) => s + 1)}
              className="sm:ml-auto"
            >
              Далее
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="button"
              disabled={loading}
              onClick={() => void publish()}
              className="sm:ml-auto"
            >
              {loading ? "Публикация…" : "Опубликовать заявку"}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
