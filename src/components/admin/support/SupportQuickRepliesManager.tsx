"use client"

import { useEffect, useState } from "react"
import { adminWebFetch, staffAppFetch } from "@/lib/admin/staff-app-fetch"
import {
  SUPPORT_QUICK_REPLY_CATEGORIES,
  quickReplyCategoryLabel,
} from "@/lib/support/operator-quick-replies"
import type { OperatorQuickReply } from "./types"

type SupportQuickRepliesManagerProps = {
  canManage: boolean
  staffApp?: boolean
}

const emptyDraft = {
  id: "",
  title: "",
  category: "general",
  body: "",
  tags: "",
  active: true,
  sortOrder: 0,
  isFavorite: false,
}

export function SupportQuickRepliesManager({ canManage }: SupportQuickRepliesManagerProps) {
  const [items, setItems] = useState<OperatorQuickReply[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [draft, setDraft] = useState(emptyDraft)
  const [message, setMessage] = useState("")
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    const res = await fetch("/api/admin/support/quick-replies")
    if (res.ok) {
      const data = await res.json()
      setItems(data.items ?? [])
    }
    setLoading(false)
  }

  useEffect(() => {
    void load()
  }, [])

  const filtered = items.filter((item) => {
    if (categoryFilter !== "all" && item.category !== categoryFilter) return false
    const needle = search.trim().toLowerCase()
    if (!needle) return true
    return item.title.toLowerCase().includes(needle) || item.body.toLowerCase().includes(needle)
  })

  async function save() {
    if (!canManage || saving) return
    setSaving(true)
    setMessage("")
    const payload = {
      id: draft.id || undefined,
      title: draft.title,
      category: draft.category,
      body: draft.body,
      tags: draft.tags.split(",").map((t) => t.trim()).filter(Boolean),
      active: draft.active,
      sortOrder: draft.sortOrder,
      isFavorite: draft.isFavorite,
    }
    const res = await api("/api/admin/support/quick-replies", {
      method: draft.id ? "PATCH" : "POST",
      json: payload,
    })
    setSaving(false)
    if (res.ok) {
      setMessage(draft.id ? "Шаблон обновлён" : "Шаблон создан")
      setDraft(emptyDraft)
      void load()
    } else {
      const data = await res.json().catch(() => ({}))
      setMessage(data.error || "Ошибка сохранения")
    }
  }

  async function remove(id: string) {
    if (!canManage || !confirm("Удалить шаблон?")) return
    const res = await api(`/api/admin/support/quick-replies?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    })
    if (res.ok) {
      void load()
      if (draft.id === id) setDraft(emptyDraft)
    }
  }

  if (!canManage) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-500">
        У вашей роли нет прав на редактирование быстрых ответов. Доступно только использование в чате.
      </div>
    )
  }

  return (
    <div className="grid min-h-0 flex-1 gap-4 overflow-hidden lg:grid-cols-[1fr_360px]">
      <div className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white">
        <div className="shrink-0 space-y-2 border-b border-zinc-100 p-4">
          <h2 className="text-lg font-semibold text-zinc-950">Быстрые ответы</h2>
          <div className="flex flex-wrap gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск…"
              className="h-9 min-w-[160px] flex-1 rounded-xl border border-zinc-200 px-3 text-sm outline-none"
            />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-9 rounded-xl border border-zinc-200 px-2 text-sm outline-none"
            >
              <option value="all">Все категории</option>
              {SUPPORT_QUICK_REPLY_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-2">
          {loading ? (
            <p className="p-6 text-center text-sm text-zinc-400">Загрузка…</p>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                className="mb-2 rounded-xl border border-zinc-100 p-3 hover:border-zinc-200"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-zinc-950">{item.title}</p>
                    <p className="text-xs text-zinc-500">
                      {quickReplyCategoryLabel(item.category)} · использований: {item.usageCount}
                      {item.isFavorite ? " · ★" : ""}
                      {!item.active ? " · выкл." : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        setDraft({
                          id: item.id,
                          title: item.title,
                          category: item.category,
                          body: item.body,
                          tags: item.tags.join(", "),
                          active: item.active,
                          sortOrder: item.sortOrder,
                          isFavorite: item.isFavorite,
                        })
                      }
                      className="rounded-lg px-2 py-1 text-xs font-semibold text-zinc-600 hover:bg-zinc-100"
                    >
                      Изменить
                    </button>
                    <button
                      type="button"
                      onClick={() => void remove(item.id)}
                      className="rounded-lg px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
                <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-sm text-zinc-600">{item.body}</p>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-zinc-950">
          {draft.id ? "Редактировать" : "Новый шаблон"}
        </h3>
        <div className="mt-3 space-y-3">
          <input
            value={draft.title}
            onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
            placeholder="Название"
            className="h-10 w-full rounded-xl border border-zinc-200 px-3 text-sm outline-none"
          />
          <select
            value={draft.category}
            onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}
            className="h-10 w-full rounded-xl border border-zinc-200 px-3 text-sm outline-none"
          >
            {SUPPORT_QUICK_REPLY_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
          <textarea
            value={draft.body}
            onChange={(e) => setDraft((d) => ({ ...d, body: e.target.value }))}
            rows={8}
            placeholder="Текст с переменными: {userName}, {listingTitle}…"
            className="w-full resize-y rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none"
          />
          <input
            value={draft.tags}
            onChange={(e) => setDraft((d) => ({ ...d, tags: e.target.value }))}
            placeholder="Теги через запятую"
            className="h-10 w-full rounded-xl border border-zinc-200 px-3 text-sm outline-none"
          />
          <div className="flex flex-wrap gap-3 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={draft.active}
                onChange={(e) => setDraft((d) => ({ ...d, active: e.target.checked }))}
              />
              Активен
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={draft.isFavorite}
                onChange={(e) => setDraft((d) => ({ ...d, isFavorite: e.target.checked }))}
              />
              Часто используется
            </label>
          </div>
          <input
            type="number"
            value={draft.sortOrder}
            onChange={(e) => setDraft((d) => ({ ...d, sortOrder: Number(e.target.value) || 0 }))}
            className="h-10 w-full rounded-xl border border-zinc-200 px-3 text-sm outline-none"
            placeholder="Сортировка"
          />
          <button
            type="button"
            onClick={() => void save()}
            disabled={saving || !draft.title.trim() || !draft.body.trim()}
            className="w-full rounded-2xl bg-zinc-950 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving ? "Сохранение…" : draft.id ? "Сохранить" : "Создать"}
          </button>
          {message ? <p className="text-xs text-zinc-500">{message}</p> : null}
        </div>
      </div>
    </div>
  )
}
