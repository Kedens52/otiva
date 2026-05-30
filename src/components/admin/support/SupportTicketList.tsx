"use client"

import { SUPPORT_TOPIC_TREE } from "@/lib/support/topics"
import type { SupportConversationSummary } from "./types"
import { isTicketClosed, ticketBadges, topicSummary, workflowLabel } from "./support-utils"

export type TicketFilters = {
  status: "all" | "open" | "closed" | "queue"
  topic: string
  priority: string
  unreadOnly: boolean
}

type SupportTicketListProps = {
  items: SupportConversationSummary[]
  selectedId: string | null
  loading: boolean
  query: string
  filters: TicketFilters
  onQueryChange: (value: string) => void
  onFiltersChange: (filters: TicketFilters) => void
  onSelect: (id: string) => void
}

export function SupportTicketList({
  items,
  selectedId,
  loading,
  query,
  filters,
  onQueryChange,
  onFiltersChange,
  onSelect,
}: SupportTicketListProps) {
  const filtered = items.filter((c) => {
    const needle = query.trim().toLowerCase()
    if (needle) {
      const client = c.client
      const haystack = `${client?.id ?? ""} ${client?.name ?? ""} ${client?.phone ?? ""} ${c.lastMessage?.text ?? ""} ${topicSummary(c.supportTopic, c.supportSubtopic) ?? ""}`.toLowerCase()
      if (!haystack.includes(needle)) return false
    }
    if (filters.unreadOnly && c.unreadCount <= 0) return false
    if (filters.status === "open" && isTicketClosed(c.supportWorkflowStatus)) return false
    if (filters.status === "closed" && !isTicketClosed(c.supportWorkflowStatus)) return false
    if (filters.status === "queue" && !c.operatorNeeded && c.supportWorkflowStatus !== "WAITING_OPERATOR") {
      return false
    }
    if (filters.topic !== "all" && c.supportTopic !== filters.topic) return false
    if (filters.priority !== "all" && (c.supportPriority ?? "normal") !== filters.priority) return false
    return true
  })

  return (
    <aside className="flex min-h-0 flex-col border-b border-zinc-200 bg-zinc-50 lg:border-b-0 lg:border-r">
      <div className="shrink-0 space-y-2 border-b border-zinc-200 p-3">
        <input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Поиск по имени, ID, тексту…"
          className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-[hsl(var(--nashlo-orange))]"
        />
        <div className="grid grid-cols-2 gap-2">
          <select
            value={filters.status}
            onChange={(e) =>
              onFiltersChange({ ...filters, status: e.target.value as TicketFilters["status"] })
            }
            className="h-9 rounded-xl border border-zinc-200 bg-white px-2 text-xs outline-none"
          >
            <option value="all">Все статусы</option>
            <option value="open">Открытые</option>
            <option value="closed">Закрытые</option>
            <option value="queue">Очередь</option>
          </select>
          <select
            value={filters.priority}
            onChange={(e) => onFiltersChange({ ...filters, priority: e.target.value })}
            className="h-9 rounded-xl border border-zinc-200 bg-white px-2 text-xs outline-none"
          >
            <option value="all">Приоритет</option>
            <option value="normal">Обычный</option>
            <option value="high">Высокий</option>
          </select>
        </div>
        <select
          value={filters.topic}
          onChange={(e) => onFiltersChange({ ...filters, topic: e.target.value })}
          className="h-9 w-full rounded-xl border border-zinc-200 bg-white px-2 text-xs outline-none"
        >
          <option value="all">Все темы</option>
          {SUPPORT_TOPIC_TREE.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-xs font-medium text-zinc-600">
          <input
            type="checkbox"
            checked={filters.unreadOnly}
            onChange={(e) => onFiltersChange({ ...filters, unreadOnly: e.target.checked })}
            className="rounded border-zinc-300"
          />
          Только непрочитанные
        </label>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading ? (
          <p className="px-4 py-10 text-center text-sm text-zinc-400">Загрузка…</p>
        ) : filtered.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-zinc-400">Обращений нет</p>
        ) : (
          filtered.map((conversation) => {
            const client = conversation.client
            const active = selectedId === conversation.id
            const closed = isTicketClosed(conversation.supportWorkflowStatus)
            const topic = topicSummary(conversation.supportTopic, conversation.supportSubtopic)
            const badges = ticketBadges(conversation)

            return (
              <button
                key={conversation.id}
                type="button"
                onClick={() => onSelect(conversation.id)}
                className={`block w-full border-t border-zinc-200 px-3 py-3 text-left transition first:border-t-0 ${
                  active ? "bg-white shadow-sm" : "hover:bg-white/80"
                } ${closed ? "opacity-70" : ""}`}
              >
                <div className="flex items-start gap-2">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[hsl(var(--nashlo-orange)/0.14)] text-sm font-bold text-[hsl(var(--nashlo-orange))]">
                    {(client?.name || client?.phone || "?")[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <p className="min-w-0 flex-1 truncate text-sm font-semibold text-zinc-950">
                        {client?.name || "Пользователь"}
                      </p>
                      {conversation.unreadCount > 0 ? (
                        <span className="rounded-full bg-[hsl(var(--nashlo-orange))] px-1.5 py-0.5 text-[10px] font-bold text-white">
                          {conversation.unreadCount}
                        </span>
                      ) : null}
                    </div>
                    {topic ? <p className="mt-0.5 truncate text-[11px] font-medium text-zinc-500">{topic}</p> : null}
                    <p className="mt-1 line-clamp-2 text-xs text-zinc-500">
                      {conversation.lastMessage?.text || "Нет сообщений"}
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      <span className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600">
                        {workflowLabel(conversation.supportWorkflowStatus, conversation.operatorNeeded)}
                      </span>
                      {badges.map((b) => (
                        <span
                          key={b}
                          className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600"
                        >
                          {b}
                        </span>
                      ))}
                    </div>
                    <p className="mt-1 text-[10px] text-zinc-400">
                      {new Date(conversation.updatedAt).toLocaleString("ru-RU", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              </button>
            )
          })
        )}
      </div>
    </aside>
  )
}
