import Link from "next/link"
import type { Permission } from "@/lib/admin/permissions"

export type DashboardAttentionStats = {
  pendingModeration: number
  openReports: number
  fraudReportsPending: number
  reviewQueueCount: number
  supportOperatorQueue: number
  paymentsPending: number
  highRiskUsers: number
  wantToBuyModeration: number
  b2bPendingReview: number
}

type AttentionItem = {
  id: string
  label: string
  description: string
  count: number
  href: string
  urgent: boolean
}

function buildAttentionItems(
  stats: DashboardAttentionStats,
  permissions: Permission[],
): AttentionItem[] {
  const can = (p: Permission) => permissions.includes(p)
  const items: AttentionItem[] = []

  if (can("listings.moderate")) {
    if (stats.pendingModeration > 0) {
      items.push({
        id: "moderation",
        label: "Объявления на проверке",
        description: "Очередь модерации",
        count: stats.pendingModeration,
        href: "/admin/moderation",
        urgent: stats.pendingModeration >= 5,
      })
    }
    if (stats.wantToBuyModeration > 0) {
      items.push({
        id: "want-to-buy",
        label: "Заявки «Куплю»",
        description: "Ждут модерации",
        count: stats.wantToBuyModeration,
        href: "/admin/want-to-buy",
        urgent: stats.wantToBuyModeration >= 3,
      })
    }
    if (stats.reviewQueueCount > 0) {
      items.push({
        id: "reviews",
        label: "Отзывы",
        description: "Модерация и споры",
        count: stats.reviewQueueCount,
        href: "/admin/reviews",
        urgent: stats.reviewQueueCount >= 3,
      })
    }
  }

  if (can("reports.view") || can("listings.moderate")) {
    if (stats.openReports > 0) {
      items.push({
        id: "reports",
        label: "Жалобы",
        description: "Открытые обращения",
        count: stats.openReports,
        href: "/admin/moderation",
        urgent: stats.openReports >= 3,
      })
    }
    if (stats.fraudReportsPending > 0) {
      items.push({
        id: "fraud",
        label: "Мошенничество",
        description: "Жалобы на мошенничество",
        count: stats.fraudReportsPending,
        href: "/admin/moderation",
        urgent: true,
      })
    }
  }

  if (can("support.view") && stats.supportOperatorQueue > 0) {
    items.push({
      id: "support",
      label: "Поддержка",
      description: "Нужен ответ оператора",
      count: stats.supportOperatorQueue,
      href: "/admin/support",
      urgent: true,
    })
  }

  if (can("payments.view") && stats.paymentsPending > 0) {
    items.push({
      id: "payments",
      label: "Платежи",
      description: "Статус pending",
      count: stats.paymentsPending,
      href: "/admin/payments",
      urgent: stats.paymentsPending >= 1,
    })
  }

  if (can("b2b.companies.moderate") && stats.b2bPendingReview > 0) {
    items.push({
      id: "b2b",
      label: "B2B компании",
      description: "На проверке",
      count: stats.b2bPendingReview,
      href: "/admin/b2b",
      urgent: stats.b2bPendingReview >= 2,
    })
  }

  if (can("users.view") && stats.highRiskUsers > 0) {
    items.push({
      id: "high-risk",
      label: "Профили HIGH_RISK",
      description: "Повышенный риск",
      count: stats.highRiskUsers,
      href: "/admin/users",
      urgent: false,
    })
  }

  return items.sort((a, b) => {
    if (a.urgent !== b.urgent) return a.urgent ? -1 : 1
    return b.count - a.count
  })
}

type Props = {
  stats: DashboardAttentionStats
  permissions: Permission[]
}

export function AdminDashboardAttention({ stats, permissions }: Props) {
  const items = buildAttentionItems(stats, permissions)

  if (items.length === 0) {
    return (
      <section
        className="mt-6 rounded-[20px] border border-emerald-200/90 bg-emerald-50 px-5 py-4"
        aria-label="Требует внимания"
      >
        <p className="font-semibold text-emerald-950">Всё под контролем</p>
        <p className="mt-1 text-sm text-emerald-900/80">
          В ваших разделах нет срочных задач — можно перейти к аналитике ниже.
        </p>
      </section>
    )
  }

  return (
    <section className="mt-6" aria-label="Требует внимания">
      <h2 className="mb-3 text-base font-semibold text-zinc-800">Требует внимания</h2>
      <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className={[
              "group flex flex-col rounded-[20px] border bg-white p-4 shadow-sm transition hover:shadow-md",
              item.urgent
                ? "border-amber-200 hover:border-amber-300"
                : "border-zinc-200 hover:border-zinc-300",
            ].join(" ")}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold text-zinc-950 group-hover:text-[hsl(var(--nashlo-orange))]">
                {item.label}
              </p>
              <span
                className={[
                  "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold tabular-nums",
                  item.urgent ? "bg-amber-100 text-amber-900" : "bg-zinc-100 text-zinc-700",
                ].join(" ")}
              >
                {item.count}
              </span>
            </div>
            <p className="mt-1 text-xs text-zinc-500">{item.description}</p>
            <p className="mt-3 text-xs font-semibold text-[hsl(var(--nashlo-orange))]">
              Открыть →
            </p>
          </Link>
        ))}
      </div>
    </section>
  )
}
