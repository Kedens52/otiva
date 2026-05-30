"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { MessageCircle } from "lucide-react"
import { BusinessHeader } from "@/components/business/BusinessHeader"
import { businessContextLabel } from "@/lib/messaging/labels"

type Conversation = {
  id: string
  contextType: string
  unreadCount: number
  company: { name: string; logoUrl: string | null } | null
  businessListing: { title: string } | null
  lastMessage: { text: string } | null
}

/** Переписка с компаниями для покупателей (без бизнес-кабинета) */
export default function BusinessBuyerChatsPage() {
  const [convs, setConvs] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void fetch("/api/business/messages/conversations")
      .then((r) => (r.ok ? r.json() : { conversations: [] }))
      .then((data) => setConvs(data.conversations ?? []))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-[#F5F6F8]">
      <BusinessHeader />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-2xl font-bold text-zinc-950">Переписка с компаниями</h1>
        <p className="mt-1 text-sm text-zinc-500">
          B2B-диалоги не смешиваются с{" "}
          <Link href="/chat" className="font-semibold text-[hsl(var(--nashlo-orange))] underline">
            личными сообщениями
          </Link>
          .
        </p>

        {loading ? (
          <p className="mt-6 text-sm text-zinc-500">Загрузка…</p>
        ) : convs.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-8 text-center">
            <MessageCircle className="mx-auto h-10 w-10 text-zinc-300" />
            <p className="mt-3 text-sm text-zinc-600">Нет активных диалогов с компаниями.</p>
          </div>
        ) : (
          <ul className="mt-6 divide-y divide-zinc-100 rounded-2xl border border-zinc-200 bg-white">
            {convs.map((c) => (
              <li key={c.id}>
                <Link href={`/business/chats/${c.id}`} className="block px-4 py-4 hover:bg-zinc-50">
                  <p className="font-semibold text-zinc-950">{c.company?.name ?? "Компания"}</p>
                  <p className="text-xs text-zinc-500">
                    {businessContextLabel(c.contextType)}
                    {c.businessListing ? ` · ${c.businessListing.title}` : ""}
                  </p>
                  {c.lastMessage && (
                    <p className="mt-1 truncate text-sm text-zinc-600">{c.lastMessage.text}</p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  )
}
