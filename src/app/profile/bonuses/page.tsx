"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { CabinetPage } from "@/components/profile/CabinetPage"
import { LegalConsentNotice } from "@/components/legal/LegalConsentNotice"

type Tx = {
  id: string
  type: string
  status: string
  reasonLabel: string
  amount: number
  balanceAfter: number
  createdAt: string
}

type BonusesData = {
  balance: number
  bonusBlocked: boolean
  referralCode?: string | null
  referralLink?: string
  nextBump: { cost: number; missing: number; canAfford: boolean }
  earnGuide: { key?: string; title: string; points: string; hint?: string }[]
  spendGuide: { key?: string; title: string; points: string }[]
  spendOffers?: { key: string; title: string; points: string }[]
  transactions: Tx[]
}

type Filter = "all" | "earn" | "spend" | "pending" | "rejected"

function statusColor(status: string): string {
  if (status === "APPROVED") return "text-emerald-600"
  if (status === "PENDING") return "text-amber-600"
  if (status === "REJECTED" || status === "REVERSED") return "text-red-500"
  return "text-zinc-400"
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    APPROVED: "Зачислено",
    PENDING: "На проверке",
    REJECTED: "Отклонено",
    REVERSED: "Отменено",
  }
  return map[status] ?? status
}

// Milestones for progress display
const MILESTONES = [100, 200, 350, 500, 750, 1000]

function nextMilestone(balance: number): number {
  return MILESTONES.find((m) => m > balance) ?? MILESTONES[MILESTONES.length - 1]
}

export default function ProfileBonusesPage() {
  const [data, setData] = useState<BonusesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>("all")
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetch("/api/profile/bonuses")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setData(d))
      .finally(() => setLoading(false))
  }, [])

  function copyReferral() {
    if (!data?.referralLink) return
    navigator.clipboard.writeText(data.referralLink).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  if (loading) {
    return (
      <CabinetPage title="Баллы Нашло">
        <div className="py-16 text-center text-sm text-zinc-400">Загрузка…</div>
      </CabinetPage>
    )
  }

  if (!data) {
    return (
      <CabinetPage title="Баллы Нашло">
        <p className="text-sm text-zinc-500">Не удалось загрузить данные.</p>
      </CabinetPage>
    )
  }

  const milestone = nextMilestone(data.balance)
  const progressPrev = MILESTONES.find((m) => m >= milestone)
    ? MILESTONES[MILESTONES.indexOf(milestone) - 1] ?? 0
    : 0
  const progressPct = Math.min(
    100,
    Math.round(((data.balance - progressPrev) / (milestone - progressPrev)) * 100)
  )

  const filteredTx = data.transactions.filter((t) => {
    if (filter === "earn") return t.amount > 0
    if (filter === "spend") return t.amount < 0
    if (filter === "pending") return t.status === "PENDING"
    if (filter === "rejected") return t.status === "REJECTED" || t.status === "REVERSED"
    return true
  })

  const FILTERS: { key: Filter; label: string }[] = [
    { key: "all", label: "Все" },
    { key: "earn", label: "Начисления" },
    { key: "spend", label: "Траты" },
    { key: "pending", label: "Ожидают" },
    { key: "rejected", label: "Отклонено" },
  ]

  return (
    <CabinetPage
      title="Баллы Нашло"
      description="Бонусные баллы за полезную активность. Не выводятся и не передаются — только на продвижение внутри сайта."
    >
      <LegalConsentNotice variant="bonus" className="-mt-2 mb-2" />
      {/* Top grid: balance + guides */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Balance card */}
        <section className="flex flex-col rounded-2xl border border-zinc-200 bg-white p-5 lg:col-span-1">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">Баланс</p>
          <p className="mt-2 text-4xl font-bold text-zinc-950">{data.balance}</p>
          <p className="mt-0.5 text-sm text-zinc-400">баллов</p>

          {data.bonusBlocked ? (
            <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">
              Бонусная активность ограничена
            </p>
          ) : null}

          {/* Progress to next milestone */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span>До {milestone} баллов</span>
              <span>{data.balance} / {milestone}</span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-zinc-100">
              <div
                className="h-full rounded-full bg-[hsl(var(--nashlo-orange))] transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {data.nextBump.canAfford ? (
            <p className="mt-3 text-sm text-emerald-700">
              ✓ Хватает на поднятие ({data.nextBump.cost} баллов)
            </p>
          ) : (
            <p className="mt-3 text-sm text-zinc-500">
              До поднятия не хватает <strong>{data.nextBump.missing}</strong> баллов
            </p>
          )}

          <Link
            href="/profile/promotion"
            className="mt-4 inline-flex items-center justify-center rounded-xl bg-[hsl(var(--nashlo-orange))] px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Продвинуть объявление
          </Link>

          {/* Referral block */}
          {data.referralLink ? (
            <div className="mt-4 rounded-xl bg-zinc-50 p-3">
              <p className="text-xs font-medium text-zinc-500">Пригласить друга (+40 баллов)</p>
              <p className="mt-1 break-all text-xs text-zinc-600">{data.referralLink}</p>
              <button
                onClick={copyReferral}
                className="mt-2 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-100"
              >
                {copied ? "Скопировано ✓" : "Копировать ссылку"}
              </button>
            </div>
          ) : null}
        </section>

        {/* Earn / Spend guides */}
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 lg:col-span-2">
          <h2 className="text-base font-semibold text-zinc-950">Как получить баллы</h2>
          <ul className="mt-3 space-y-2.5">
            {data.earnGuide.map((item, i) => (
              <li key={item.key ?? i} className="flex items-start justify-between gap-4 text-sm">
                <span className="text-zinc-700">
                  {item.title}
                  {item.hint ? (
                    <span className="ml-1.5 text-xs text-zinc-400">{item.hint}</span>
                  ) : null}
                </span>
                <span className="shrink-0 font-semibold text-emerald-700">{item.points}</span>
              </li>
            ))}
          </ul>

          <h2 className="mt-6 text-base font-semibold text-zinc-950">На что потратить</h2>
          <ul className="mt-3 space-y-2.5">
            {(data.spendOffers ?? data.spendGuide).map((item, i) => (
              <li key={(item as { key?: string }).key ?? i} className="flex items-center justify-between gap-4 text-sm">
                <span className="text-zinc-700">{item.title}</span>
                <span className="shrink-0 font-semibold text-zinc-950">{item.points} баллов</span>
              </li>
            ))}
          </ul>

          <p className="mt-4 rounded-xl bg-zinc-50 px-3 py-2 text-xs text-zinc-500">
            Продвижение за баллы — мягкое усиление, не заменяет релевантность и качество объявления в поиске.
          </p>
        </section>
      </div>

      {/* Referral code (if no link shown above) */}
      {data.referralCode && !data.referralLink ? (
        <section className="mt-4 rounded-2xl border border-zinc-200 bg-white p-5">
          <h2 className="text-base font-semibold text-zinc-950">Ваш реферальный код</h2>
          <p className="mt-2 font-mono text-lg font-bold tracking-widest text-zinc-950">{data.referralCode}</p>
          <p className="mt-1 text-xs text-zinc-400">Поделитесь кодом — получите +40 баллов, когда друг разместит первое объявление.</p>
        </section>
      ) : null}

      {/* Rules */}
      <section className="mt-4 rounded-2xl border border-zinc-200 bg-white p-5">
        <h2 className="text-base font-semibold text-zinc-950">Правила программы</h2>
        <ul className="mt-3 space-y-1.5 text-sm text-zinc-600">
          <li>• Баллы начисляются только за реальные действия на сайте.</li>
          <li>• Лимит начисления: <strong>120 баллов в день</strong>, 400 баллов в неделю.</li>
          <li>• Баллы не выводятся в деньги и не передаются другим пользвателям.</li>
          <li>• Поделиться объявлением можно раз в неделю на одной платформе (ВКонтакте или МАХ).</li>
          <li>• Баллы за реферала начисляются, когда приглашённый разместит первое объявление.</li>
          <li>• При нарушении правил сайта бонусная активность может быть ограничена.</li>
          <li>• Нашло оставляет за собой право изменить условия программы с уведомлением.</li>
        </ul>
      </section>

      {/* History */}
      <section className="mt-4 rounded-2xl border border-zinc-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-zinc-950">История операций</h2>
          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                  filter === f.key
                    ? "bg-zinc-900 text-white"
                    : "border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {filteredTx.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-400">
            {filter === "all" ? "Пока нет операций" : "Нет операций в этой категории"}
          </p>
        ) : (
          <div className="mt-3 divide-y divide-zinc-100">
            {filteredTx.map((t) => (
              <div key={t.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium text-zinc-900">{t.reasonLabel}</p>
                  <p className="text-xs text-zinc-400">
                    {new Date(t.createdAt).toLocaleString("ru-RU")}
                    {" · "}
                    <span className={statusColor(t.status)}>{statusLabel(t.status)}</span>
                  </p>
                </div>
                <div className="flex flex-col items-end gap-0.5">
                  <span className={`font-bold ${t.amount > 0 ? "text-emerald-600" : t.amount < 0 ? "text-zinc-800" : "text-zinc-400"}`}>
                    {t.amount > 0 ? "+" : ""}
                    {t.amount}
                  </span>
                  <span className="text-xs text-zinc-400">→ {t.balanceAfter}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </CabinetPage>
  )
}
