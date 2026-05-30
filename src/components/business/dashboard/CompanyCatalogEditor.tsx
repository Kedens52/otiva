"use client"

import { useEffect, useState } from "react"
import { Trash2 } from "lucide-react"

type Category = {
  id: string
  title: string
  slug: string
  description: string | null
  sortOrder: number
  _count?: { listings: number }
}

export function CompanyCatalogEditor({ companyId }: { companyId: string }) {
  const [items, setItems] = useState<Category[]>([])
  const [title, setTitle] = useState("")
  const [loading, setLoading] = useState(false)

  function load() {
    fetch(`/api/business/companies/${companyId}/catalog-categories`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setItems(d?.items ?? []))
  }

  useEffect(() => {
    load()
  }, [companyId])

  async function add() {
    if (!title.trim()) return
    setLoading(true)
    const res = await fetch(`/api/business/companies/${companyId}/catalog-categories`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim() }),
    })
    setLoading(false)
    if (res.ok) {
      setTitle("")
      load()
    }
  }

  async function remove(id: string) {
    if (!confirm("Удалить раздел? Позиции останутся без раздела.")) return
    await fetch(`/api/business/companies/${companyId}/catalog-categories/${id}`, { method: "DELETE" })
    load()
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-600">Разделы каталога на публичной витрине компании.</p>
      <div className="flex gap-2">
        <input
          className="min-w-0 flex-1 rounded-xl border border-zinc-200 px-3 py-2 text-sm"
          placeholder="Название раздела, напр. Бытовая химия"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <button
          type="button"
          disabled={loading}
          onClick={() => void add()}
          className="shrink-0 rounded-xl bg-zinc-950 px-4 py-2 text-sm font-semibold text-white"
        >
          Добавить
        </button>
      </div>
      <ul className="divide-y rounded-xl border border-zinc-200 bg-white">
        {items.length === 0 ? (
          <li className="px-4 py-6 text-center text-sm text-zinc-500">Пока нет разделов — товары в общем списке</li>
        ) : (
          items.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-2 px-4 py-3">
              <div>
                <p className="font-medium text-zinc-950">{c.title}</p>
                <p className="text-xs text-zinc-500">
                  {c._count?.listings ?? 0} позиций · /{c.slug}
                </p>
              </div>
              <button type="button" onClick={() => void remove(c.id)} className="text-zinc-400 hover:text-red-600" aria-label="Удалить">
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))
        )}
      </ul>
      <p className="text-xs text-zinc-500">
        Привязку B2B-объявлений к разделу — при создании/редактировании предложения (поле категории каталога — в следующем обновлении формы create).
      </p>
    </div>
  )
}
