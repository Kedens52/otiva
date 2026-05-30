"use client"

import Link from "next/link"
import { useEffect, useRef } from "react"
import type { SupportMessage } from "./types"
import {
  isAutoReplyPayload,
  isBotFlowPayload,
  isSystemSupportPayload,
  timeLabel,
} from "./support-utils"

type SupportMessageListProps = {
  messages: SupportMessage[]
}

export function SupportMessageList({ messages }: SupportMessageListProps) {
  const endRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [messages.length, messages.at(-1)?.id])

  return (
    <div ref={containerRef} className="min-h-0 flex-1 overflow-y-auto bg-zinc-50 px-4 py-4 sm:px-5">
      <div className="space-y-3">
        {messages.map((message) => {
          const fromSupport =
            message.sender.role === "MODERATOR" || message.sender.role === "ADMIN"
          const pl = message.supportPayload as Record<string, unknown> | undefined

          if (fromSupport && isBotFlowPayload(pl)) {
            return (
              <div key={message.id} className="flex justify-end">
                <div className="max-w-[85%] rounded-[22px] rounded-br-md border border-zinc-200 bg-white px-4 py-2.5 text-left text-zinc-950 shadow-sm sm:max-w-[72%]">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">Сценарий бота</p>
                  {Array.isArray(pl.breadcrumbs) && pl.breadcrumbs.length ? (
                    <p className="mt-1 text-xs text-zinc-500">{(pl.breadcrumbs as string[]).join(" → ")}</p>
                  ) : null}
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-snug">{message.text}</p>
                  <p className="mt-1 text-[11px] text-zinc-400">{timeLabel(message.createdAt)}</p>
                </div>
              </div>
            )
          }

          if (fromSupport && isAutoReplyPayload(pl)) {
            return (
              <div key={message.id} className="flex justify-end">
                <div className="max-w-[85%] rounded-[22px] rounded-br-md bg-zinc-950 px-4 py-2.5 text-left text-white shadow-sm sm:max-w-[72%]">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-white/50">Автоответ</p>
                  <p className="mt-1 text-sm font-semibold">{String(pl.title ?? "")}</p>
                  <p className="mt-2 text-sm leading-snug text-white">{message.text || String(pl.body ?? "")}</p>
                  <p className="mt-1 text-[11px] text-white/40">{timeLabel(message.createdAt)}</p>
                </div>
              </div>
            )
          }

          if (fromSupport && isSystemSupportPayload(pl)) {
            return (
              <div key={message.id} className="flex justify-end">
                <div className="max-w-[85%] rounded-[22px] rounded-br-md bg-zinc-800 px-4 py-2.5 text-left text-white shadow-sm sm:max-w-[72%]">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-white/45">Системное</p>
                  <p className="mt-1 text-sm leading-snug text-white/90">{message.text}</p>
                  <p className="mt-1 text-[11px] text-white/45">{timeLabel(message.createdAt)}</p>
                </div>
              </div>
            )
          }

          return (
            <div key={message.id} className={`flex ${fromSupport ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-[22px] px-4 py-2.5 shadow-sm sm:max-w-[72%] ${
                  fromSupport
                    ? "rounded-br-md bg-zinc-950 text-white"
                    : "rounded-bl-md bg-white text-zinc-950"
                }`}
              >
                <p className="whitespace-pre-wrap break-words text-sm leading-6">{message.text}</p>
                {message.images?.length ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {message.images.map((src) => (
                      <Link key={src} href={src} target="_blank" rel="noreferrer">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={src} alt="" className="h-20 w-20 rounded-lg object-cover" />
                      </Link>
                    ))}
                  </div>
                ) : null}
                <p className={`mt-1 text-[11px] ${fromSupport ? "text-white/55" : "text-zinc-400"}`}>
                  {timeLabel(message.createdAt)}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={endRef} />
      </div>
    </div>
  )
}
