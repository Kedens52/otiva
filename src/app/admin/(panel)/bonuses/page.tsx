"use client"

import { useEffect, useState } from "react"
import { getAdminCsrfFromDocument } from "@/lib/admin/csrf-client"
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader"
import { AdminPageShell } from "@/components/admin/layout/AdminPageShell"

type Tx = {
  id: string
  type: string
  status: string
  reason: string
  reasonLabel: string
  amount: number
  balanceAfter: number
  createdAt: string
  user: { id: string; name: string | null; phone: string | null; bonusBalance: number; bonusBlocked: boolean }
}

export default function AdminBonusesPage() {
  const [items, setItems] = useState<Tx[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState("")
  const [userId, setUserId] = useState("")
  const [adjustUserId, setAdjustUserId] = useState("")
  const [adjustAmount, setAdjustAmount] = useState("")
  const [adjustNote, setAdjustNote] = useState("")
  const [msg, setMsg] = useState<string | null>(null)

  async function load(st = status, uid = userId) {
    setLoading(true)
    const q = new URLSearchParams()
    if (st) q.set("status", st)
    if (uid.trim()) q.set("userId", uid.trim())
    const res = await fetch(`/api/admin/bonuses?${q}`)
    if (res.ok) {
      const d = await res.json()
      setItems(d.items ?? [])
      setTotal(d.total ?? 0)
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function patchTx(id: string, action: "approve" | "reject" | "reverse") {
    const res = await fetch(`/api/admin/bonuses/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": getAdminCsrfFromDocument(),
      },
      body: JSON.stringify({ action }),
    })
    if (res.ok) {
      setMsg("Готово")
      load()
    } else {
      const d = await res.json().catch(() => ({}))
      setMsg(d.error ?? "Ошибка")
    }
  }

  async function adjust() {
    const amount = parseInt(adjustAmount, 10)
    if (!adjustUserId.trim() || !amount) return
    const res = await fetch("/api/admin/bonuses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": getAdminCsrfFromDocument(),
      },
      body: JSON.stringify({
        userId: adjustUserId.trim(),
        amount,
        note: adjustNote.trim() || undefined,
      }),
    })
    const d = await res.json().catch(() => ({}))
    setMsg(res.ok ? `Баланс: ${d.balanceAfter}` : (d.error ?? "Ошибка"))
    if (res.ok) load()
  }

  return (
    <AdminPageShell className="py-8">
      <AdminPageHeader title="Баллы «Нашло»" description={`Операций: ${total}`} />

      <div className="mt-6 rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold text-zinc-950">Ручная корректировка</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <input
            placeholder="ID пользователя"
            value={adjustUserId}
            onChange={(e) => setAdjustUserId(e.target.value)}
            className="rounded-xl border border-zinc-200 px-3 py-2 text-sm min-w-[200px]"
          />
          <input
            placeholder="Сумма (+/-)"
            value={adjustAmount}
            onChange={(e) => setAdjustAmount(e.target.value)}
            className="rounded-xl border border-zinc-200 px-3 py-2 text-sm w-28"
          />
          <input
            placeholder="Комментарий"
            value={adjustNote}
            onChange={(e) => setAdjustNote(e.target.value)}
            className="rounded-xl border border-zinc-200 px-3 py-2 text-sm flex-1 min-w-[160px]"
          />
          <button
            type="button"
            onClick={adjust}
            className="rounded-xl bg-zinc-950 px-4 py-2 text-sm font-semibold text-white"
          >
            Применить
          </button>
        </div>
        {msg ? <p className="mt-2 text-sm text-zinc-600">{msg}</p> : null}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <input
          placeholder="Фильтр userId"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          className="rounded-xl border border-zinc-200 px-3 py-2 text-sm"
        />
        <button type="button" onClick={() => load()} className="rounded-xl bg-zinc-100 px-4 py-2 text-sm font-semibold">
          Найти
        </button>
        {["", "PENDING", "APPROVED", "REJECTED", "REVERSED"].map((st) => (
          <button
            key={st}
            type="button"
            onClick={() => {
              setStatus(st)
              load(st)
            }}
            className={`rounded-xl px-4 py-2 text-sm font-semibold ${
              status === st ? "bg-zinc-950 text-white" : "bg-zinc-100 text-zinc-600"
            }`}
          >
            {st || "Все"}
          </button>
        ))}
      </div>

      <div className="mt-6 overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-sm">
        {loading ? (
          <div className="py-12 text-center text-sm text-zinc-400">Загрузка…</div>
        ) : items.length === 0 ? (
          <div className="py-12 text-center text-sm text-zinc-400">Операций нет</div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {items.map((t) => (
              <div key={t.id} className="px-5 py-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-zinc-950">
                      {t.reasonLabel}{" "}
                      <span className={t.amount > 0 ? "text-emerald-600" : "text-red-600"}>
                        {t.amount > 0 ? "+" : ""}
                        {t.amount}
                      </span>
                    </p>
                    <p className="text-sm text-zinc-500">
                      {t.user.name ?? t.user.phone ?? t.user.id} · баланс {t.user.bonusBalance} · {t.status}
                    </p>
                    <p className="text-xs text-zinc-400">{new Date(t.createdAt).toLocaleString("ru-RU")}</p>
                  </div>
                  {t.status === "PENDING" ? (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => patchTx(t.id, "approve")}
                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white"
                      >
                        Одобрить
                      </button>
                      <button
                        type="button"
                        onClick={() => patchTx(t.id, "reject")}
                        className="rounded-lg bg-zinc-200 px-3 py-1.5 text-xs font-semibold"
                      >
                        Отклонить
                      </button>
                    </div>
                  ) : t.status === "APPROVED" && t.type === "EARN" ? (
                    <button
                      type="button"
                      onClick={() => patchTx(t.id, "reverse")}
                      className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700"
                    >
                      Отменить
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminPageShell>
  )
}
