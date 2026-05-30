"use client"

import Link from "next/link"
import type { SupportConversationDetail, SupportTicketContext } from "./types"
import { lastAutoReplyFeedback, lastAutoReplySummary, topicSummary, workflowLabel } from "./support-utils"

type SupportTicketContextPanelProps = {
  ticket: SupportConversationDetail
  context: SupportTicketContext | null
}

function ContextRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <p className="text-xs text-zinc-600">
      <span className="font-semibold text-zinc-800">{label}:</span> {value}
    </p>
  )
}

export function SupportTicketContextPanel({ ticket, context }: SupportTicketContextPanelProps) {
  const topic = topicSummary(ticket.supportTopic, ticket.supportSubtopic)

  return (
    <header className="shrink-0 border-b border-zinc-100 bg-white">
      <div className="flex flex-wrap items-start justify-between gap-3 px-4 py-3 sm:px-5">
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-semibold text-zinc-950">
            {ticket.client?.name || "Пользователь"}
          </p>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-zinc-500">
            <span className="font-mono">№ {ticket.id.slice(0, 8)}</span>
            {context?.client?.phone ? <span>{context.client.phone}</span> : null}
            {context?.client?.email ? <span>{context.client.email}</span> : null}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {context?.client ? (
            <Link
              href={context.client.adminUrl}
              className="rounded-xl border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
            >
              Профиль в админке
            </Link>
          ) : null}
        </div>
      </div>

      <div className="grid gap-3 border-t border-zinc-100 bg-zinc-50/80 px-4 py-3 sm:grid-cols-2 sm:px-5 lg:grid-cols-3">
        <div className="space-y-1 rounded-2xl border border-zinc-200 bg-white p-3">
          <p className="text-[11px] font-bold uppercase tracking-wide text-zinc-400">Обращение</p>
          <ContextRow label="Статус" value={workflowLabel(ticket.supportWorkflowStatus, ticket.operatorNeeded)} />
          {topic ? <ContextRow label="Тема" value={topic} /> : null}
          {ticket.supportPriority ? <ContextRow label="Приоритет" value={ticket.supportPriority} /> : null}
          <ContextRow
            label="Автоответ"
            value={lastAutoReplySummary(ticket.messages) ?? "—"}
          />
          <ContextRow
            label="Реакция"
            value={
              lastAutoReplyFeedback(ticket.messages)
                ?? (ticket.lastAutoReplyAction === "HELPFUL"
                  ? "Помогло"
                  : ticket.lastAutoReplyAction === "ESCALATED"
                    ? "Не помогло"
                    : "—")
            }
          />
        </div>

        {context?.listing ? (
          <div className="space-y-2 rounded-2xl border border-zinc-200 bg-white p-3">
            <p className="text-[11px] font-bold uppercase tracking-wide text-zinc-400">Объявление</p>
            <div className="flex gap-3">
              {context.listing.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={context.listing.image}
                  alt=""
                  className="h-14 w-14 shrink-0 rounded-xl object-cover"
                />
              ) : null}
              <div className="min-w-0">
                <p className="line-clamp-2 text-sm font-semibold text-zinc-950">{context.listing.title}</p>
                <p className="mt-0.5 text-xs text-zinc-500">
                  {context.listing.price.toLocaleString("ru-RU")} ₽
                  {context.listing.city ? ` · ${context.listing.city}` : ""}
                </p>
                <p className="text-xs text-zinc-500">{context.listing.categoryName ?? "—"}</p>
              </div>
            </div>
            <ContextRow label="Статус" value={context.listing.status} />
            {context.listing.moderationReasonCode || context.listing.rejectionReason ? (
              <ContextRow
                label="Модерация"
                value={context.listing.rejectionReason || context.listing.moderationReasonCode}
              />
            ) : null}
            {context.listing.promotions.length ? (
              <ContextRow label="Продвижение" value={context.listing.promotions.join(", ")} />
            ) : null}
            <div className="flex flex-wrap gap-2 pt-1">
              <Link href={context.listing.publicUrl} target="_blank" className="text-xs font-semibold text-[hsl(var(--nashlo-orange))] underline">
                Открыть объявление
              </Link>
              <Link href={context.listing.adminUrl} className="text-xs font-semibold text-zinc-700 underline">
                В админке
              </Link>
            </div>
          </div>
        ) : null}

        {context?.adCampaign ? (
          <div className="space-y-1 rounded-2xl border border-zinc-200 bg-white p-3">
            <p className="text-[11px] font-bold uppercase tracking-wide text-zinc-400">Реклама</p>
            <ContextRow label="Кампания" value={context.adCampaign.title} />
            <ContextRow label="Статус" value={context.adCampaign.status} />
            <ContextRow label="Формат" value={context.adCampaign.type} />
            {context.adCampaign.budget != null ? (
              <ContextRow label="Бюджет" value={`${context.adCampaign.budget.toLocaleString("ru-RU")} ₽`} />
            ) : null}
            <Link href="/profile/ads" className="text-xs font-semibold text-[hsl(var(--nashlo-orange))] underline">
              Кабинет рекламы
            </Link>
          </div>
        ) : null}

        {context?.business &&
        (context.business.company || context.business.listing || context.business.request) ? (
          <div className="space-y-1 rounded-2xl border border-zinc-200 bg-white p-3">
            <p className="text-[11px] font-bold uppercase tracking-wide text-zinc-400">Бизнес</p>
            {context.business.company ? (
              <>
                <ContextRow label="Компания" value={context.business.company.name} />
                <ContextRow label="Статус" value={context.business.company.status} />
                <Link href={context.business.company.publicUrl} className="text-xs font-semibold text-[hsl(var(--nashlo-orange))] underline">
                  Профиль компании
                </Link>
              </>
            ) : null}
            {context.business.listing ? (
              <ContextRow label="B2B-объявление" value={context.business.listing.title} />
            ) : null}
            {context.business.request ? (
              <ContextRow label="Заявка" value={context.business.request.title} />
            ) : null}
          </div>
        ) : null}
      </div>
    </header>
  )
}
