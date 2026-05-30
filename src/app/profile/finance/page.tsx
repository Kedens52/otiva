"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { WalletTopUpFlow } from "@/components/payments/WalletTopUpFlow"

type Transaction = {
  id: string
  type: string
  status: string
  amount: number
  balanceAfter: number
  title: string
  listingId: string | null
  createdAt: string
}

type Tab = "topup" | "history"

function formatPrice(n: number) {
  return Math.abs(n).toLocaleString("ru-RU") + " ₽"
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function TxIcon({ type, amount }: { type: string; amount: number }) {
  if (amount > 0 || type === "CREDIT" || type === "BONUS") {
    return (
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-sm font-bold text-emerald-600">
        +
      </div>
    )
  }
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-50 text-sm font-bold text-red-500">
      −
    </div>
  )
}

export default function FinancePage() {
  const [balance, setBalance] = useState(0)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>("topup")

  async function load() {
    setLoading(true)
    try {
      const res = await fetch("/api/wallet")
      if (res.ok) {
        const d = await res.json()
        setBalance(d.balance ?? 0)
        setTransactions(d.transactions ?? [])
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-24 rounded-2xl bg-white animate-pulse shadow-sm" />
        <div className="h-80 rounded-2xl bg-white animate-pulse shadow-sm" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/80 bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.05)] sm:p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--nashlo-orange))]">
          Ваш баланс
        </p>
        <p className="mt-2 text-3xl font-bold text-zinc-950 sm:text-4xl">
          {balance.toLocaleString("ru-RU")} <span className="text-2xl text-zinc-400">₽</span>
        </p>
        <Link
          href="/profile/promotion"
          className="mt-4 inline-flex rounded-xl bg-[hsl(var(--nashlo-orange))] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[hsl(var(--nashlo-orange)/0.92)]"
        >
          Продвинуть объявление
        </Link>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
        <div className="flex gap-6 border-b border-zinc-200">
          <button
            type="button"
            onClick={() => setTab("topup")}
            className={
              "pb-3 text-sm font-semibold transition " +
              (tab === "topup"
                ? "border-b-2 border-zinc-950 text-zinc-950"
                : "text-zinc-400 hover:text-zinc-600")
            }
          >
            Пополнение кошелька
          </button>
          <button
            type="button"
            onClick={() => setTab("history")}
            className={
              "pb-3 text-sm font-semibold transition " +
              (tab === "history"
                ? "border-b-2 border-zinc-950 text-zinc-950"
                : "text-zinc-400 hover:text-zinc-600")
            }
          >
            История операций
          </button>
        </div>

        <div className="mt-6">
          {tab === "topup" ? (
            <WalletTopUpFlow balance={balance} onPaid={load} />
          ) : transactions.length === 0 ? (
            <div className="rounded-xl bg-zinc-50 py-12 text-center">
              <p className="text-sm text-zinc-500">Операций пока не было</p>
            </div>
          ) : (
            <div className="space-y-1">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center gap-3 rounded-xl px-2 py-3 transition hover:bg-zinc-50 sm:px-3"
                >
                  <TxIcon type={tx.type} amount={tx.amount} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-950">{tx.title}</p>
                    <p className="mt-0.5 text-xs text-zinc-400">{formatDate(tx.createdAt)}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p
                      className={
                        "text-sm font-bold " + (tx.amount >= 0 ? "text-emerald-600" : "text-zinc-950")
                      }
                    >
                      {tx.amount >= 0 ? "+" : "−"}
                      {formatPrice(tx.amount)}
                    </p>
                    <p className="text-[11px] text-zinc-400">
                      {tx.balanceAfter.toLocaleString("ru-RU")} ₽
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
