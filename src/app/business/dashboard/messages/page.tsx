"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Building2, MessageCircle } from "lucide-react"
import { BusinessSectionGuard } from "@/components/business/BusinessSectionGuard"
import { businessContextLabel } from "@/lib/messaging/labels"

type Conversation = {
  id: string
  updatedAt: string
  contextType: string
  unreadCount: number
  company: { id: string; name: string; logoUrl: string | null } | null
  businessListing: { id: string; title: string; slug: string | null } | null
  businessInquiry: { type: string; contactName: string | null } | null
  members: { userId: string; user: { id: string; name: string | null; avatar: string | null } }[]
  lastMessage: { text: string; createdAt: string; sender: { name: string | null } } | null
}

export default function BusinessDashboardMessagesPage() {
  const [convs, setConvs] = useState<Conversation[]>([])
  const [meId, setMeId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void (async () => {
      const meRes = await fetch("/api/auth/me")
      if (!meRes.ok) {
        setLoading(false)
        return
      }
      const meData = await meRes.json()
      setMeId(meData.user?.id ?? meData.id)

      const res = await fetch("/api/business/messages/conversations")
      if (res.ok) {
        const data = await res.json()
        setConvs(data.conversations ?? [])
      }
      setLoading(false)
    })()
  }, [])

  function peerLabel(conv: Conversation) {
    const other = conv.members.find((m) => m.userId !== meId)
    if (other?.user.name) return other.user.name
    if (conv.businessInquiry?.contactName) return conv.businessInquiry.contactName
    return "Покупатель"
  }

  return (
    <BusinessSectionGuard section="messages">
      <div className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-zinc-950">Сообщения бизнеса</h1>
            <p className="mt-1 text-sm text-zinc-500">
              Диалоги компании по B2B.{" "}
              <Link href="/chat" className="font-semibold text-[hsl(var(--nashlo-orange))] underline">
                Личные сообщения
              </Link>{" "}
              — в обычном кабинете.
            </p>
          </div>
          <Link
            href="/business/dashboard/inquiries"
            className="text-sm font-semibold text-zinc-600 underline"
          >
            Запросы прайса и КП
          </Link>
        </div>

        {loading ? (
          <p className="text-sm text-zinc-500">Загрузка…</p>
        ) : convs.length === 0 ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center">
            <MessageCircle className="mx-auto h-10 w-10 text-zinc-300" />
            <p className="mt-3 text-sm text-zinc-600">Пока нет бизнес-диалогов.</p>
          </div>
        ) : (
          <ul className="divide-y divide-zinc-100 overflow-hidden rounded-2xl border border-zinc-200 bg-white">
            {convs.map((conv) => (
              <li key={conv.id}>
                <Link
                  href={`/business/dashboard/messages/${conv.id}`}
                  className="flex gap-3 px-4 py-4 hover:bg-zinc-50"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-zinc-100">
                    {conv.company?.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={conv.company.logoUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <Building2 className="h-5 w-5 text-zinc-400" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate font-semibold text-zinc-950">{peerLabel(conv)}</p>
                      {conv.unreadCount > 0 && (
                        <span className="shrink-0 rounded-full bg-[hsl(var(--nashlo-orange))] px-2 py-0.5 text-xs font-bold text-white">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500">
                      {businessContextLabel(conv.contextType, conv.businessInquiry?.type)}
                      {conv.businessListing ? ` · ${conv.businessListing.title}` : ""}
                    </p>
                    {conv.lastMessage && (
                      <p className="mt-1 truncate text-sm text-zinc-600">{conv.lastMessage.text}</p>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </BusinessSectionGuard>
  )
}
