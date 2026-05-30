"use client"

import { useEffect, useState } from "react"
import { getAdminCsrfFromDocument } from "@/lib/admin/csrf-client"
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader"
import { AdminPageShell } from "@/components/admin/layout/AdminPageShell"
import { AdminStatusBadge } from "@/components/admin/ui/AdminStatusBadge"

type Client = {
  id: string
  companyName: string
  contactName: string | null
  phone: string | null
  email: string | null
  city: string | null
  status: string
  source: string | null
  createdAt: string
  assignedManager: { displayName: string | null; login: string } | null
  _count: { deals: number; businessNotes: number }
}

export default function AdminBusinessPage() {
  const [items,   setItems]   = useState<Client[]>([])
  const [total,   setTotal]   = useState(0)
  const [loading, setLoading] = useState(true)
  const [q,       setQ]       = useState("")
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState("")
  const [adding,  setAdding]  = useState(false)

  async function load(search = q) {
    setLoading(true)
    const res = await fetch(`/api/admin/business?q=${encodeURIComponent(search)}`)
    if (res.ok) {
      const d = await res.json()
      setItems(d.items ?? [])
      setTotal(d.total ?? 0)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function addClient() {
    if (!newName.trim()) return
    setAdding(true)
    const res = await fetch("/api/admin/business", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-CSRF-Token": getAdminCsrfFromDocument() },
      body: JSON.stringify({ companyName: newName.trim() }),
    })
    if (res.ok) {
      setNewName("")
      setShowAdd(false)
      load()
    }
    setAdding(false)
  }

  return (
    <AdminPageShell className="py-8">
      <AdminPageHeader
        title="Бизнес CRM"
        description={`Рекламодатели и бизнес-клиенты. Всего: ${total}`}
        actions={
          <button
            onClick={() => setShowAdd((v) => !v)}
            className="rounded-2xl bg-zinc-950 px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-800"
          >
            + Добавить клиента
          </button>
        }
      />

      {showAdd && (
        <div className="mt-4 flex gap-3 rounded-2xl border border-zinc-200 bg-white p-4">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addClient()}
            placeholder="Название компании"
            className="h-11 flex-1 rounded-xl border border-zinc-200 px-4 text-sm outline-none focus:border-orange-400"
            autoFocus
          />
          <button
            onClick={addClient}
            disabled={adding || !newName.trim()}
            className="rounded-xl bg-zinc-950 px-5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {adding ? "Создаём..." : "Создать"}
          </button>
        </div>
      )}

      <div className="mt-5 flex gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load(q)}
          placeholder="Поиск по компании, контакту, телефону..."
          className="h-11 w-full max-w-sm rounded-2xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-orange-400"
        />
        <button
          onClick={() => load(q)}
          className="rounded-2xl bg-zinc-100 px-5 text-sm font-semibold hover:bg-zinc-200"
        >
          Найти
        </button>
      </div>

      <div className="mt-6 overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-sm">
        {loading ? (
          <div className="py-12 text-center text-sm text-zinc-400">Загрузка…</div>
        ) : items.length === 0 ? (
          <div className="py-12 text-center text-sm text-zinc-400">Клиентов не найдено</div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {items.map((client) => (
              <div key={client.id} className="grid gap-3 px-5 py-4 md:grid-cols-[minmax(0,1fr)_auto_auto_auto] md:items-center">
                <div className="min-w-0">
                  <p className="font-semibold text-zinc-950">{client.companyName}</p>
                  <p className="text-sm text-zinc-500">
                    {client.contactName && `${client.contactName} · `}
                    {client.phone && `${client.phone} · `}
                    {client.city && `${client.city} · `}
                    {client.source && `Источник: ${client.source}`}
                  </p>
                  <p className="text-xs text-zinc-400">
                    {client._count.deals} сделок · {client._count.businessNotes} заметок
                    {client.assignedManager && ` · ${client.assignedManager.displayName ?? client.assignedManager.login}`}
                  </p>
                </div>
                <AdminStatusBadge variant="business" status={client.status} />
                <span className="text-xs text-zinc-400">
                  {new Date(client.createdAt).toLocaleDateString("ru-RU")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminPageShell>
  )
}
