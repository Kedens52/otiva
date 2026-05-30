"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { LEGAL_LINKS } from "@/lib/legal-meta"
import { recordLegalConsents } from "@/lib/legal-consent-client"

type Listing = {
  id: string
  title: string
  price: number
  images: string[]
  views: number
  promotedUntil: string | null
  highlightedUntil: string | null
  pinnedUntil: string | null
  category: { nameRu: string; slug: string }
}

type PriceTable = Record<string, Record<string, number>>

const SERVICE_META: Record<string, { label: string; desc: string; icon: string; durations: number[] }> = {
  BUMP:      { label: "Поднятие в поиске",      desc: "Объявление поднимается выше в результатах поиска",       icon: "↑",  durations: [1, 3, 7] },
  HIGHLIGHT: { label: "Выделение цветом",        desc: "Объявление становится заметнее среди других",             icon: "★",  durations: [3, 7]    },
  PIN:       { label: "Закрепление в категории", desc: "Показывается в верхнем блоке категории",                  icon: "📌", durations: [1, 3, 7] },
  TURBO:     { label: "Турбо-продвижение",       desc: "Комплекс: поднятие, выделение и дополнительные показы",   icon: "🚀", durations: [3, 7]    },
}

function formatPrice(n: number) { return n.toLocaleString("ru-RU") + " ₽" }
function formatDate(iso: string) { return new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" }) }

function isActive(until: string | null): boolean {
  if (!until) return false
  return new Date(until) > new Date()
}

export default function PromotionPage() {
  const [listings, setListings]       = useState<Listing[]>([])
  const [priceTable, setPriceTable]   = useState<PriceTable>({})
  const [balance, setBalance]         = useState<number>(0)
  const [bonusBalance, setBonusBalance] = useState<number>(0)
  const [bonusApplying, setBonusApplying] = useState(false)
  const [selected, setSelected]       = useState<string | null>(null)
  const [loading, setLoading]         = useState(true)
  const [applying, setApplying]       = useState(false)
  const [success, setSuccess]         = useState<string | null>(null)
  const [error, setError]             = useState<string | null>(null)
  const [choices, setChoices]         = useState<Record<string, { type: string; days: number }>>({})
  const [offerAccepted, setOfferAccepted] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const [promRes, walletRes, bonusRes] = await Promise.all([
        fetch("/api/profile/promotion"),
        fetch("/api/wallet"),
        fetch("/api/profile/bonuses"),
      ])
      if (promRes.ok) {
        const d = await promRes.json()
        setListings(d.listings ?? [])
        setPriceTable(d.priceTable ?? {})
      }
      if (walletRes.ok) {
        const w = await walletRes.json()
        setBalance(w.balance ?? 0)
      }
      if (bonusRes.ok) {
        const b = await bonusRes.json()
        setBonusBalance(b.balance ?? 0)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  function getChoice(listingId: string) {
    return choices[listingId] ?? { type: "BUMP", days: 1 }
  }

  function setChoice(listingId: string, type: string, days: number) {
    setChoices(prev => ({ ...prev, [listingId]: { type, days } }))
  }

  function getPrice(type: string, days: number): number {
    return priceTable[type]?.[days] ?? 0
  }

  async function applyBonusPromotion(listingId: string, offer: "BUMP_1D" | "HIGHLIGHT_3D") {
    setBonusApplying(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch("/api/bonuses/spend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId, offer }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.code === "INSUFFICIENT") {
          setError(`Недостаточно баллов. Нужно ${data.need ?? "—"}, на счёте ${bonusBalance}`)
        } else {
          setError(data.error ?? "Ошибка")
        }
        return
      }
      setBonusBalance(data.balance ?? bonusBalance)
      setSuccess("Продвижение за баллы подключено!")
      load()
    } catch {
      setError("Ошибка соединения с сервером")
    } finally {
      setBonusApplying(false)
    }
  }

  async function applyService(listingId: string) {
    if (!offerAccepted) {
      setError("Подтвердите согласие с условиями оферты для оплаты услуги.")
      return
    }
    const { type, days } = getChoice(listingId)
    const price = getPrice(type, days)
    setApplying(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch("/api/profile/promotion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId, serviceType: type, durationDays: days }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.needTopUp) {
          setError(`Недостаточно средств. Нужно ${formatPrice(price)}, на балансе ${formatPrice(balance)}`)
        } else {
          setError(data.error ?? "Ошибка при подключении")
        }
        return
      }
      await recordLegalConsents(["OFFER"], "promotion_service")
      setBalance(b => b - price)
      setSuccess("Услуга подключена! Объявление уже продвигается.")
      load()
    } catch {
      setError("Ошибка соединения с сервером")
    } finally {
      setApplying(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 rounded-xl bg-zinc-200 animate-pulse" />
        {[1,2].map(i => <div key={i} className="h-48 rounded-2xl bg-white animate-pulse shadow-sm" />)}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-5">
        <h1 className="text-xl font-bold text-zinc-950">Продвижение объявлений</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Услуги продвижения — технические опции на площадке; они не гарантируют сделку или продажу. Подробнее — в{" "}
          <Link href={LEGAL_LINKS.promotionOffer} className="font-medium text-zinc-950 underline underline-offset-2">
            оферте на услуги продвижения
          </Link>
          .
        </p>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-zinc-500">Кошелёк:</span>
              <span className="text-base font-bold text-zinc-950">{formatPrice(balance)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-zinc-500">Баллы Нашло:</span>
              <span className="text-base font-bold text-zinc-950">{bonusBalance}</span>
              <Link href="/profile/bonuses" className="text-xs font-semibold text-[hsl(var(--nashlo-orange))] hover:underline">
                Как получить
              </Link>
            </div>
          </div>
          <Link href="/profile/finance"
            className="w-full rounded-xl bg-orange-500 px-4 py-2 text-center text-sm font-semibold text-white hover:brightness-105 transition sm:w-auto">
            Пополнить
          </Link>
        </div>
      </div>

      {/* Alerts */}
      {success && (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-700 font-medium flex items-center justify-between">
          {success}
          <button onClick={() => setSuccess(null)} className="text-emerald-400 hover:text-emerald-600 ml-4">✕</button>
        </div>
      )}
      {error && (
        <div className="rounded-2xl bg-red-50 border border-red-200 p-4 text-sm text-red-700 font-medium flex items-center justify-between">
          <div>
            <p>{error}</p>
            {error.includes("средств") && (
              <Link href="/profile/finance" className="mt-1 inline-block text-orange-600 hover:underline">Пополнить баланс →</Link>
            )}
          </div>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 ml-4">✕</button>
        </div>
      )}

      {/* No listings */}
      {listings.length === 0 && (
        <div className="rounded-2xl bg-white p-10 shadow-sm text-center">
          <p className="text-2xl mb-3">📋</p>
          <p className="text-base font-semibold text-zinc-950">Нет активных объявлений</p>
          <p className="mt-1 text-sm text-zinc-500">Сначала создайте объявление, затем вы сможете его продвигать</p>
          <Link href="/create"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white">
            + Создать объявление
          </Link>
        </div>
      )}

      {/* Listing cards */}
      {listings.map(listing => {
        const ch = getChoice(listing.id)
        const price = getPrice(ch.type, ch.days)
        const canAfford = balance >= price
        const isSelected = selected === listing.id
        const meta = SERVICE_META[ch.type]

        return (
          <div key={listing.id}
            className={"rounded-2xl bg-white shadow-sm overflow-hidden border-2 transition " + (isSelected ? "border-orange-500" : "border-transparent")}>

            {/* Listing info */}
            <div className="flex items-start gap-3 p-3 cursor-pointer hover:bg-zinc-50 transition sm:items-center sm:p-4"
              onClick={() => setSelected(isSelected ? null : listing.id)}>
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-zinc-100">
                {listing.images?.[0]
                  ? <img src={listing.images[0]} alt="" className="h-full w-full object-cover" />
                  : <div className="flex h-full w-full items-center justify-center text-zinc-400 text-xs">Фото</div>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-zinc-950 truncate">{listing.title}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{listing.category.nameRu} · {listing.price.toLocaleString("ru-RU")} ₽</p>
                <div className="mt-1 flex flex-wrap gap-2">
                  {isActive(listing.promotedUntil) && (
                    <span className="text-[10px] bg-orange-50 text-orange-600 font-semibold px-2 py-0.5 rounded-full">
                      ↑ Поднято до {formatDate(listing.promotedUntil!)}
                    </span>
                  )}
                  {isActive(listing.highlightedUntil) && (
                    <span className="text-[10px] bg-yellow-50 text-yellow-700 font-semibold px-2 py-0.5 rounded-full">
                      ★ Выделено до {formatDate(listing.highlightedUntil!)}
                    </span>
                  )}
                  {isActive(listing.pinnedUntil) && (
                    <span className="text-[10px] bg-blue-50 text-blue-600 font-semibold px-2 py-0.5 rounded-full">
                      📌 Закреплено до {formatDate(listing.pinnedUntil!)}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-zinc-400 text-sm shrink-0">{isSelected ? "▲" : "▼"}</div>
            </div>

            {/* Service picker */}
            {isSelected && (
              <div className="border-t border-zinc-100 p-4 space-y-4">

                {/* Service type tabs */}
                <div>
                  <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">Услуга</p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {Object.entries(SERVICE_META).map(([key, m]) => (
                      <button key={key}
                        onClick={() => setChoice(listing.id, key, m.durations[0])}
                        className={"rounded-xl border p-3 text-left transition " + (ch.type === key ? "border-orange-500 bg-orange-50" : "border-zinc-200 bg-zinc-50 hover:border-zinc-300")}>
                        <p className="text-lg">{m.icon}</p>
                        <p className={"text-xs font-semibold mt-1 " + (ch.type === key ? "text-orange-700" : "text-zinc-900")}>{m.label}</p>
                        <p className="text-[10px] text-zinc-500 mt-0.5 leading-4">{m.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Duration */}
                <div>
                  <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">Срок</p>
                  <div className="flex flex-wrap gap-2">
                    {meta.durations.map(d => {
                      const p = getPrice(ch.type, d)
                      return (
                        <button key={d}
                          onClick={() => setChoice(listing.id, ch.type, d)}
                          className={"rounded-xl border px-4 py-2.5 text-sm font-medium transition " + (ch.days === d ? "border-orange-500 bg-orange-50 text-orange-700" : "border-zinc-200 bg-zinc-50 text-zinc-700 hover:border-zinc-300")}>
                          {d} {d === 1 ? "день" : d < 5 ? "дня" : "дней"}
                          <span className="ml-2 text-xs font-bold">{formatPrice(p)}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Apply */}
                <label className="flex cursor-pointer gap-2.5 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-left text-xs leading-snug text-zinc-600">
                  <input
                    type="checkbox"
                    checked={offerAccepted}
                    onChange={(e) => setOfferAccepted(e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-zinc-300 text-orange-500 focus:ring-orange-400"
                  />
                  <span>
                    Оплачивая услугу со счёта, принимаю{" "}
                    <Link href={LEGAL_LINKS.promotionOffer} className="font-medium text-zinc-950 underline underline-offset-2">
                      оферту на услуги продвижения
                    </Link>
                    . Понимаю, что услуга касается только показов на сайте, а не товара в объявлении.
                  </span>
                </label>

                <div className="rounded-xl border border-violet-100 bg-violet-50/50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-violet-800">Продвинуть за баллы</p>
                  <p className="mt-1 text-xs text-violet-700/90">
                    Мягкое усиление в поиске. Нужно качественное объявление (3+ фото, описание от 50 символов).
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={bonusApplying || bonusBalance < 70}
                      onClick={() => applyBonusPromotion(listing.id, "BUMP_1D")}
                      className="rounded-xl border border-violet-200 bg-white px-4 py-2 text-sm font-semibold text-violet-900 disabled:opacity-50"
                    >
                      Поднять 1 день · 70
                    </button>
                    <button
                      type="button"
                      disabled={bonusApplying || bonusBalance < 120}
                      onClick={() => applyBonusPromotion(listing.id, "HIGHLIGHT_3D")}
                      className="rounded-xl border border-violet-200 bg-white px-4 py-2 text-sm font-semibold text-violet-900 disabled:opacity-50"
                    >
                      Выделить 3 дня · 120
                    </button>
                    {bonusBalance < 70 ? (
                      <Link href="/profile/bonuses" className="self-center text-xs font-semibold text-violet-800 underline">
                        Как получить баллы
                      </Link>
                    ) : null}
                  </div>
                </div>

                <div className="flex flex-col gap-3 border-t border-zinc-100 pt-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-bold text-zinc-950">{formatPrice(price)}</p>
                    <p className="text-xs text-zinc-500">
                      {canAfford
                        ? "Спишется с баланса: останется " + formatPrice(balance - price)
                        : <span className="text-red-500">Недостаточно средств</span>
                      }
                    </p>
                  </div>
                  {canAfford ? (
                    <button
                      onClick={() => applyService(listing.id)}
                      disabled={applying}
                      className="w-full rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:brightness-105 transition disabled:opacity-60 sm:w-auto">
                      {applying ? "Подключение..." : "Подключить за рубли"}
                    </button>
                  ) : (
                    <Link href="/profile/finance"
                      className="w-full rounded-xl bg-[hsl(var(--nashlo-orange))] px-5 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-[hsl(var(--nashlo-orange)/0.92)] sm:w-auto">
                      Пополнить баланс
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        )
      })}

      {/* Services info */}
      <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-5">
        <h2 className="text-sm font-bold text-zinc-950 mb-3">Что даёт продвижение</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {Object.entries(SERVICE_META).map(([, m]) => (
            <div key={m.label} className="flex items-start gap-3 rounded-xl bg-zinc-50 p-3">
              <span className="text-xl shrink-0">{m.icon}</span>
              <div>
                <p className="text-sm font-semibold text-zinc-950">{m.label}</p>
                <p className="text-xs text-zinc-500 mt-0.5 leading-5">{m.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
