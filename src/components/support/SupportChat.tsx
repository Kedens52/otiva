"use client"

import Link from "next/link"
import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { isAutoReplyPayload, isBotFlowPayload, type BotFlowPayload } from "@/lib/support/payload"
import { SUPPORT_TOPIC_TREE } from "@/lib/support/topics"
import { cn } from "@/lib/utils"

type Sender = { id: string; name: string | null; avatar: string | null; role: string }

type SupportMessage = {
  id: string
  text: string
  createdAt: string
  supportPayload?: unknown
  sender: Sender
}

type SupportConversation = {
  id: string
  supportWorkflowStatus?: string
  operatorNeeded?: boolean
  supportTopic?: string | null
  messages: SupportMessage[]
}

function timeLabel(ts: string) {
  return new Date(ts).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
}

function statusLabel(conv: SupportConversation | null) {
  if (!conv) return null
  if (conv.operatorNeeded || conv.supportWorkflowStatus === "WAITING_OPERATOR") {
    return { text: "Ждёт ответа специалиста", className: "bg-amber-50 text-amber-800" }
  }
  if (conv.supportWorkflowStatus === "WAITING_USER") {
    return { text: "Нужен ваш ответ", className: "bg-blue-50 text-blue-800" }
  }
  if (conv.supportWorkflowStatus === "RESOLVED_AUTO") {
    return { text: "Закрыто", className: "bg-zinc-100 text-zinc-600" }
  }
  return { text: "Ассистент онлайн", className: "bg-emerald-50 text-emerald-700" }
}

type Props = {
  className?: string
  showBackLink?: boolean
  backHref?: string
  compactHeader?: boolean
}

export function SupportChat({
  className,
  showBackLink = false,
  backHref = "/chat",
  compactHeader = false,
}: Props) {
  const router = useRouter()
  const [conversation, setConversation] = useState<SupportConversation | null>(null)
  const [meId, setMeId] = useState<string | null>(null)
  const [text, setText] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [topicOpen, setTopicOpen] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const load = useCallback(async () => {
    const meRes = await fetch("/api/auth/me")
    if (!meRes.ok) {
      router.push("/login?from=/support")
      return false
    }
    const meData = await meRes.json()
    setMeId(meData.user?.id ?? meData.id)

    const res = await fetch("/api/support")
    if (res.ok) {
      const data = await res.json()
      setConversation(data.conversation)
    }
    return true
  }, [router])

  useEffect(() => {
    load().finally(() => setLoading(false))
    const timer = setInterval(() => {
      load()
    }, 6000)
    return () => clearInterval(timer)
  }, [load])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [conversation?.messages.length])

  async function sendPayload(body: Record<string, string>) {
    if (sending) return
    setSending(true)
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        const data = await res.json()
        setConversation(data.conversation)
      }
    } finally {
      setSending(false)
    }
  }

  async function sendText() {
    const trimmed = text.trim()
    if (!trimmed) return
    setText("")
    await sendPayload({ text: trimmed })
  }

  async function onButton(buttonId: string) {
    await sendPayload({ buttonId })
  }

  async function onListing(listingId: string) {
    await sendPayload({ listingId })
  }

  async function onAutoFeedback(messageId: string, action: "helpful" | "escalate") {
    setSending(true)
    try {
      const res = await fetch("/api/support", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, action }),
      })
      if (res.ok) {
        const data = await res.json()
        setConversation(data.conversation)
      }
    } finally {
      setSending(false)
    }
  }

  const status = statusLabel(conversation)

  if (loading) {
    return (
      <div className={cn("flex flex-1 items-center justify-center", className)}>
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-[hsl(var(--nashlo-orange))]" />
      </div>
    )
  }

  return (
    <div className={cn("flex h-full min-h-0 flex-col overflow-hidden bg-white lg:rounded-[28px] lg:border lg:border-white/80 lg:shadow-[0_18px_48px_rgba(15,23,42,0.08)]", className)}>
      <header
        className={cn(
          "shrink-0 border-b border-zinc-100 bg-white/95 backdrop-blur",
          compactHeader ? "px-4 py-3" : "px-4 pb-4 pt-[calc(env(safe-area-inset-top)+0.85rem)] lg:pt-5"
        )}
      >
        <div className="flex items-center gap-3">
          {showBackLink ? (
            <Link
              href={backHref}
              className="flex h-10 w-10 items-center justify-center rounded-full text-3xl text-[hsl(var(--nashlo-orange))]"
            >
              ‹
            </Link>
          ) : null}
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] bg-[hsl(var(--nashlo-orange))] text-lg font-bold text-white">
            ?
          </div>
          <div className="min-w-0 flex-1">
            <h1 className={cn("truncate font-semibold text-zinc-950", compactHeader ? "text-lg" : "text-xl")}>
              Поддержка Нашло
            </h1>
            <p className="truncate text-sm text-zinc-500">Уточним тему и передадим специалисту при необходимости</p>
          </div>
          {status ? (
            <span className={cn("hidden shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold sm:inline", status.className)}>
              {status.text}
            </span>
          ) : null}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setTopicOpen(true)}
            className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:border-[hsl(var(--nashlo-orange)/0.4)]"
          >
            Выбрать тему
          </button>
          <button
            type="button"
            onClick={() => onButton("human")}
            disabled={sending}
            className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:border-[hsl(var(--nashlo-orange)/0.4)]"
          >
            Позвать человека
          </button>
        </div>
      </header>

      <section className="min-h-0 flex-1 overflow-y-auto bg-zinc-50 px-3 py-4 sm:px-4 lg:px-5">
        {!conversation?.messages.length ? (
          <div className="flex h-full flex-col items-center justify-center px-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[hsl(var(--nashlo-orange)/0.12)] text-2xl font-bold text-[hsl(var(--nashlo-orange))]">
              ?
            </div>
            <p className="mt-4 font-semibold text-zinc-950">Чем помочь?</p>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-zinc-500">
              Напишите «не выдаёт» или выберите тему — задам уточняющие вопросы и соберу обращение.
            </p>
            <button
              type="button"
              onClick={() => setTopicOpen(true)}
              className="mt-4 rounded-xl bg-[hsl(var(--nashlo-orange))] px-5 py-2.5 text-sm font-semibold text-white"
            >
              Выбрать тему
            </button>
          </div>
        ) : (
          <div className="mx-auto max-w-2xl space-y-3">
            {conversation.messages.map((message) => {
              const isMe = message.sender.id === meId
              const pl = message.supportPayload

              return (
                <div key={message.id} className={cn("flex flex-col gap-2", isMe ? "items-end" : "items-start")}>
                  {isBotFlowPayload(pl) && pl.breadcrumbs?.length ? (
                    <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-400">
                      {pl.breadcrumbs.join(" → ")}
                    </p>
                  ) : null}

                  <div
                    className={cn(
                      "max-w-[92%] rounded-[22px] px-4 py-2.5 shadow-sm sm:max-w-[85%]",
                      isMe ? "rounded-br-md bg-[hsl(var(--nashlo-orange))] text-white" : "rounded-bl-md bg-white text-zinc-950"
                    )}
                  >
                    <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed">{message.text}</p>
                    <p className={cn("mt-1 text-[11px]", isMe ? "text-white/70" : "text-zinc-400")}>
                      {timeLabel(message.createdAt)}
                    </p>
                  </div>

                  {!isMe && isAutoReplyPayload(pl) && pl.actionState === "pending" ? (
                    <div className="flex max-w-[92%] flex-wrap gap-2">
                      {pl.links?.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          className="rounded-full border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700"
                        >
                          {link.label}
                        </Link>
                      ))}
                      <button
                        type="button"
                        onClick={() => onAutoFeedback(message.id, "helpful")}
                        className="rounded-full bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800"
                      >
                        Помогло
                      </button>
                      <button
                        type="button"
                        onClick={() => onAutoFeedback(message.id, "escalate")}
                        className="rounded-full bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900"
                      >
                        Нужен оператор
                      </button>
                    </div>
                  ) : null}

                  {!isMe && isBotFlowPayload(pl) ? (
                    <BotActions
                      payload={pl}
                      disabled={sending}
                      onButton={onButton}
                      onListing={onListing}
                    />
                  ) : null}
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </section>

      <footer className="shrink-0 border-t border-zinc-100 bg-white px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 sm:px-4 lg:px-5 lg:pb-4">
        {status ? (
          <p className={cn("mb-2 inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold sm:hidden", status.className)}>
            {status.text}
          </p>
        ) : null}
        <div className="flex items-end gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={1}
            placeholder="Ваш вопрос — например: не выдаёт"
            className="max-h-[116px] min-h-12 min-w-0 flex-1 resize-none rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-base outline-none focus:border-[hsl(var(--nashlo-orange))] focus:bg-white"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                sendText()
              }
            }}
          />
          <button
            type="button"
            onClick={sendText}
            disabled={!text.trim() || sending}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[hsl(var(--nashlo-orange))] text-lg font-semibold text-white disabled:bg-zinc-100 disabled:text-zinc-400"
            aria-label="Отправить"
          >
            ↑
          </button>
        </div>
      </footer>

      {topicOpen ? (
        <SupportTopicModal
          onClose={() => setTopicOpen(false)}
          onPick={(topicId) => {
            setTopicOpen(false)
            onButton(`root:${topicId}`)
          }}
        />
      ) : null}
    </div>
  )
}

function BotActions({
  payload,
  disabled,
  onButton,
  onListing,
}: {
  payload: BotFlowPayload
  disabled: boolean
  onButton: (id: string) => void
  onListing: (id: string) => void
}) {
  if (!isBotFlowPayload(payload)) return null

  return (
    <div className="flex w-full max-w-[92%] flex-col gap-2">
      {payload.listings?.length ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {payload.listings.map((l) => (
            <button
              key={l.id}
              type="button"
              disabled={disabled}
              onClick={() => onListing(l.id)}
              className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white p-2.5 text-left transition hover:border-[hsl(var(--nashlo-orange)/0.35)] disabled:opacity-50"
            >
              {l.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={l.image} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
              ) : (
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-[10px] text-zinc-400">
                  фото
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-zinc-950">{l.title}</p>
                <p className="text-xs text-zinc-500">
                  {l.price.toLocaleString("ru-RU")} ₽ · {l.status}
                </p>
              </div>
            </button>
          ))}
        </div>
      ) : null}
      {payload.buttons?.length ? (
        <div className="flex flex-wrap gap-2">
          {payload.buttons.map((b) => (
            <button
              key={b.id}
              type="button"
              disabled={disabled}
              onClick={() => onButton(b.id)}
              className="min-h-[40px] rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 transition hover:border-[hsl(var(--nashlo-orange)/0.35)] hover:text-[hsl(var(--nashlo-orange))] disabled:opacity-50"
            >
              {b.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function SupportTopicModal({ onClose, onPick }: { onClose: () => void; onPick: (topicId: string) => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
      <div className="max-h-[85dvh] w-full overflow-hidden rounded-t-3xl bg-white shadow-xl sm:max-w-md sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-4">
          <h2 className="text-lg font-semibold text-zinc-950">Тема обращения</h2>
          <button type="button" onClick={onClose} className="text-2xl text-zinc-400">
            ×
          </button>
        </div>
        <div className="overflow-y-auto px-3 py-3 pb-[calc(env(safe-area-inset-bottom)+12px)]">
          {SUPPORT_TOPIC_TREE.map((topic) => (
            <button
              key={topic.id}
              type="button"
              onClick={() => onPick(topic.id)}
              className="mb-2 flex w-full min-h-[48px] items-center justify-between rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-3 text-left text-sm font-semibold text-zinc-900 transition hover:bg-white hover:shadow-sm"
            >
              {topic.label}
              <span className="text-zinc-300">›</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
