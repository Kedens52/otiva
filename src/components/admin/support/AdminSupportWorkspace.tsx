"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { ChevronLeft } from "lucide-react"
import { adminWebFetch } from "@/lib/admin/staff-app-fetch"
import { staffAppFetch } from "@/lib/admin/staff-app-fetch"
import type { QuickReplyVariableContext } from "@/lib/support/operator-quick-replies"
import { SupportComposer } from "./SupportComposer"
import { SupportMessageList } from "./SupportMessageList"
import { SupportQuickRepliesManager } from "./SupportQuickRepliesManager"
import { SupportTicketContextPanel } from "./SupportTicketContextPanel"
import { SupportTicketList, type TicketFilters } from "./SupportTicketList"
import type {
  OperatorQuickReply,
  SupportConversationDetail,
  SupportConversationSummary,
  SupportPermissions,
  SupportTicketContext,
} from "./types"
import { isTicketClosed } from "./support-utils"
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader"

type Tab = "tickets" | "quickReplies"

type AdminSupportWorkspaceProps = {
  /** Десктоп-приложение /admin/app — Bearer вместо cookie+CSRF */
  staffApp?: boolean
}

export function AdminSupportWorkspace({ staffApp = false }: AdminSupportWorkspaceProps) {
  const api = staffApp ? staffAppFetch : adminWebFetch
  const [tab, setTab] = useState<Tab>("tickets")
  const [conversations, setConversations] = useState<SupportConversationSummary[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detail, setDetail] = useState<SupportConversationDetail | null>(null)
  const [context, setContext] = useState<SupportTicketContext | null>(null)
  const [permissions, setPermissions] = useState<SupportPermissions>({
    canReply: false,
    canManageQuickReplies: false,
    canViewSensitive: false,
  })
  const [quickReplies, setQuickReplies] = useState<OperatorQuickReply[]>([])
  const [query, setQuery] = useState("")
  const [filters, setFilters] = useState<TicketFilters>({
    status: "all",
    topic: "all",
    priority: "all",
    unreadOnly: false,
  })
  const [listLoading, setListLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [resolving, setResolving] = useState(false)
  const [mobilePane, setMobilePane] = useState<"list" | "dialog">("list")

  const loadList = useCallback(async () => {
    const res = await api("/api/admin/support")
    if (res.ok) {
      const data = await res.json()
      const items = (data.conversations ?? []) as SupportConversationSummary[]
      setConversations(items)
      setSelectedId((current) => current ?? items[0]?.id ?? null)
    }
    setListLoading(false)
  }, [api])

  const loadQuickReplies = useCallback(async () => {
    const res = await api("/api/admin/support/quick-replies")
    if (res.ok) {
      const data = await res.json()
      setQuickReplies(data.items ?? [])
      if (data.canManage != null) {
        setPermissions((p) => ({ ...p, canManageQuickReplies: Boolean(data.canManage) }))
      }
    }
  }, [api])

  const loadDetail = useCallback(async (conversationId: string) => {
    setDetailLoading(true)
    const res = await api(`/api/admin/support/${conversationId}`)
    if (res.ok) {
      const data = await res.json()
      setDetail(data.conversation as SupportConversationDetail)
      setContext(data.context as SupportTicketContext)
      if (data.permissions) setPermissions(data.permissions)
    } else {
      setDetail(null)
      setContext(null)
    }
    setDetailLoading(false)
  }, [api])

  useEffect(() => {
    void loadList()
    void loadQuickReplies()
    const timer = setInterval(() => {
      void loadList()
      if (selectedId) void loadDetail(selectedId)
    }, 7000)
    return () => clearInterval(timer)
  }, [loadList, loadQuickReplies, loadDetail, selectedId])

  useEffect(() => {
    if (selectedId) void loadDetail(selectedId)
    else {
      setDetail(null)
      setContext(null)
    }
  }, [selectedId, loadDetail])

  const unreadTotal = useMemo(
    () => conversations.reduce((sum, item) => sum + item.unreadCount, 0),
    [conversations],
  )

  const variableContext: QuickReplyVariableContext = useMemo(
    () => ({
      userName: context?.client?.name ?? detail?.client?.name,
      listingTitle: context?.listing?.title,
      listingUrl: context?.listing?.publicUrl,
      ticketNumber: detail?.id?.slice(0, 8),
      category: context?.listing?.categoryName,
      moderationReason: context?.listing?.rejectionReason ?? context?.listing?.moderationReasonCode,
      companyName: context?.business?.company?.name,
      adCampaignName: context?.adCampaign?.title,
      businessListingTitle: context?.business?.listing?.title,
    }),
    [context, detail],
  )

  async function sendReply(
    text: string,
    meta?: { quickReplyId?: string; wasEdited?: boolean },
  ) {
    if (!selectedId || sending) return
    setSending(true)
    try {
      const res = await fetch("/api/admin/support", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": getAdminCsrfFromDocument() },
        body: JSON.stringify({
          conversationId: selectedId,
          text,
          quickReplyId: meta?.quickReplyId,
          quickReplyWasEdited: meta?.wasEdited,
        }),
      })
      if (res.ok) {
        await Promise.all([loadList(), loadDetail(selectedId), loadQuickReplies()])
      }
    } finally {
      setSending(false)
    }
  }

  async function patchTicket(action: "close" | "reopen") {
    if (!selectedId || resolving) return
    setResolving(true)
    try {
      const res = await api("/api/admin/support", {
        method: "PATCH",
        json: { conversationId: selectedId, action },
      })
      if (res.ok) {
        await Promise.all([loadList(), loadDetail(selectedId)])
      }
    } finally {
      setResolving(false)
    }
  }

  function selectTicket(id: string) {
    setSelectedId(id)
    setMobilePane("dialog")
  }

  const closed = detail ? isTicketClosed(detail.supportWorkflowStatus) : false
  const lastUserMessage = [...(detail?.messages ?? [])]
    .reverse()
    .find((m) => m.sender.role !== "MODERATOR" && m.sender.role !== "ADMIN")?.text

  return (
    <div
      className={`flex min-h-0 flex-col overflow-hidden ${
        staffApp ? "h-full" : "h-[calc(100dvh-env(safe-area-inset-top)-4rem)] lg:h-[calc(100dvh-2rem)]"
      }`}
    >
      <div className="shrink-0 border-b border-zinc-200 bg-white px-4 py-3 sm:px-5 lg:px-6">
        <AdminPageHeader
          title="Поддержка"
          description="Обращения пользователей · операторский чат"
          actions={
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
              <div className="flex items-center justify-between gap-3 sm:justify-start">
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-2 text-center">
                  <p className="text-lg font-semibold text-zinc-950">{unreadTotal}</p>
                  <p className="text-[11px] text-zinc-500">непрочитанных</p>
                </div>
              </div>
              <div className="flex w-full rounded-2xl border border-zinc-200 bg-zinc-50 p-1 sm:w-auto">
                <TabBtn active={tab === "tickets"} onClick={() => setTab("tickets")} className="flex-1 sm:flex-none">
                  Обращения
                </TabBtn>
                <TabBtn
                  active={tab === "quickReplies"}
                  onClick={() => setTab("quickReplies")}
                  className="flex-1 sm:flex-none"
                >
                  Быстрые ответы
                </TabBtn>
              </div>
            </div>
          }
        />
      </div>

      {tab === "quickReplies" ? (
        <div className="min-h-0 flex-1 overflow-hidden p-4 sm:p-5 lg:p-6">
          <SupportQuickRepliesManager
            canManage={permissions.canManageQuickReplies}
            staffApp={staffApp}
          />
        </div>
      ) : (
        <div className="grid min-h-0 flex-1 overflow-hidden bg-zinc-50 lg:grid-cols-[minmax(0,360px)_1fr]">
          <div className={`min-h-0 ${mobilePane === "dialog" ? "hidden lg:flex lg:flex-col" : "flex flex-col"}`}>
            <SupportTicketList
              items={conversations}
              selectedId={selectedId}
              loading={listLoading}
              query={query}
              filters={filters}
              onQueryChange={setQuery}
              onFiltersChange={setFilters}
              onSelect={selectTicket}
            />
          </div>

          <section
            className={`flex min-h-0 flex-col bg-white ${
              mobilePane === "list" ? "hidden lg:flex" : "flex"
            }`}
          >
            <div className="flex shrink-0 items-center gap-2 border-b border-zinc-100 px-3 py-2 lg:hidden">
              <button
                type="button"
                onClick={() => setMobilePane("list")}
                className="inline-flex items-center gap-1 rounded-xl px-2 py-1.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-100"
              >
                <ChevronLeft className="h-4 w-4" />
                К обращениям
              </button>
            </div>

            {!selectedId ? (
              <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-zinc-400">
                Выберите обращение слева
              </div>
            ) : detailLoading && !detail ? (
              <div className="flex flex-1 items-center justify-center text-sm text-zinc-400">
                Загрузка диалога…
              </div>
            ) : detail ? (
              <>
                <SupportTicketContextPanel ticket={detail} context={context} />
                <SupportMessageList messages={detail.messages} />
                <SupportComposer
                  closed={closed}
                  canReply={permissions.canReply}
                  sending={sending}
                  resolving={resolving}
                  quickReplies={quickReplies}
                  variableContext={variableContext}
                  supportTopic={detail.supportTopic}
                  supportSubtopic={detail.supportSubtopic}
                  lastMessageText={lastUserMessage}
                  hasListing={Boolean(context?.listing)}
                  hasAd={Boolean(context?.adCampaign)}
                  hasBusiness={Boolean(
                    context?.business?.company ||
                      context?.business?.listing ||
                      context?.business?.request,
                  )}
                  onSend={sendReply}
                  onClose={() => void patchTicket("close")}
                  onReopen={() => void patchTicket("reopen")}
                />
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center text-sm text-red-600">
                Не удалось загрузить обращение
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  )
}

function TabBtn({
  active,
  onClick,
  children,
  className = "",
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl px-3 py-1.5 text-sm font-semibold ${
        active ? "bg-white text-zinc-950 shadow-sm" : "text-zinc-600 hover:text-zinc-900"
      } ${className}`}
    >
      {children}
    </button>
  )
}
