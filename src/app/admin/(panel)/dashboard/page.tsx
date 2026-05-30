import { redirect } from "next/navigation"
import { getAdminSession } from "@/lib/admin/adminSession"
import { expandPermissions, hasAdminPermission } from "@/lib/admin/permissions"
import { prisma } from "@/lib/prisma"
import {
  AdminDashboardAttention,
  type DashboardAttentionStats,
} from "@/components/admin/dashboard/AdminDashboardAttention"
import { AdminDashboardActivity } from "@/components/admin/dashboard/AdminDashboardActivity"
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader"
import { AdminPageShell } from "@/components/admin/layout/AdminPageShell"

export const dynamic = "force-dynamic"

type DayCount = { day: string; count: number }

async function getStats() {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const week = new Date(today.getTime() - 7 * 86400_000)

  const [
    totalUsers,
    newUsersToday,
    newUsersWeek,
    totalListings,
    pendingModeration,
    activeListings,
    totalPayments,
    recentPayments,
    openReports,
    fraudReportsPending,
    reviewQueueCount,
    highRiskUsers,
    supportOperatorQueue,
    paymentsPending,
    wantToBuyModeration,
    b2bPendingReview,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: today } } }),
    prisma.user.count({ where: { createdAt: { gte: week } } }),
    prisma.listing.count(),
    prisma.listing.count({ where: { status: "MODERATION" } }),
    prisma.listing.count({ where: { status: "ACTIVE" } }),
    prisma.payment.count(),
    prisma.payment.count({ where: { createdAt: { gte: week }, status: "SUCCEEDED" } }),
    prisma.report.count({ where: { status: "pending" } }),
    prisma.report.count({ where: { status: "pending", reason: "fraud" } }),
    prisma.review.count({
      where: {
        isDeleted: false,
        OR: [{ reviewModerationState: "PENDING_MODERATION" }, { reviewModerationState: "DISPUTED" }],
      },
    }),
    prisma.user.count({ where: { trustTier: "HIGH_RISK" } }),
    prisma.conversation.count({
      where: { isSupport: true, OR: [{ operatorNeeded: true }, { supportWorkflowStatus: "WAITING_OPERATOR" }] },
    }),
    prisma.payment.count({ where: { status: "PENDING" } }),
    prisma.wantToBuy.count({ where: { status: "MODERATION" } }),
    prisma.company.count({ where: { verificationStatus: "PENDING_REVIEW" } }),
  ])

  return {
    totalUsers, newUsersToday, newUsersWeek,
    totalListings, pendingModeration, activeListings,
    totalPayments, recentPayments,
    openReports, fraudReportsPending,
    reviewQueueCount, highRiskUsers,
    supportOperatorQueue, paymentsPending,
    wantToBuyModeration, b2bPendingReview,
  }
}

async function getChartData(): Promise<{ users: DayCount[]; listings: DayCount[]; payments: DayCount[] }> {
  try {
    const [usersRaw, listingsRaw, paymentsRaw] = await Promise.all([
      prisma.$queryRaw<{ day: Date; count: bigint }[]>`
        SELECT DATE("createdAt" AT TIME ZONE 'UTC') AS day, COUNT(*)::int AS count
        FROM "User"
        WHERE "createdAt" >= NOW() - INTERVAL '14 days'
        GROUP BY day ORDER BY day
      `,
      prisma.$queryRaw<{ day: Date; count: bigint }[]>`
        SELECT DATE("createdAt" AT TIME ZONE 'UTC') AS day, COUNT(*)::int AS count
        FROM "Listing"
        WHERE "createdAt" >= NOW() - INTERVAL '14 days'
        GROUP BY day ORDER BY day
      `,
      prisma.$queryRaw<{ day: Date; count: bigint }[]>`
        SELECT DATE("createdAt" AT TIME ZONE 'UTC') AS day, COUNT(*)::int AS count
        FROM "Payment"
        WHERE "createdAt" >= NOW() - INTERVAL '14 days'
          AND status = 'SUCCEEDED'
        GROUP BY day ORDER BY day
      `,
    ])

    const toSeries = (raw: { day: Date; count: bigint }[]): DayCount[] =>
      raw.map((r) => ({
        day: new Date(r.day).toISOString().slice(0, 10),
        count: Number(r.count),
      }))
    return { users: toSeries(usersRaw), listings: toSeries(listingsRaw), payments: toSeries(paymentsRaw) }
  } catch {
    return { users: [], listings: [], payments: [] }
  }
}

function StatCard({
  label, value, sub, color = "orange",
}: {
  label: string; value: number | string; sub?: string; color?: string
}) {
  const colors: Record<string, string> = {
    orange: "text-orange-600",
    red:    "text-red-600",
    green:  "text-emerald-600",
    blue:   "text-blue-600",
  }
  return (
    <div className="rounded-[20px] border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">{label}</p>
      <p className={`text-2xl font-bold sm:text-3xl ${colors[color] ?? colors.orange}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-zinc-400">{sub}</p>}
    </div>
  )
}

function fillDays(data: DayCount[], days = 14): DayCount[] {
  const map = new Map(data.map((d) => [d.day, d.count]))
  const result: DayCount[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date()
    d.setUTCDate(d.getUTCDate() - i)
    const key = d.toISOString().slice(0, 10)
    result.push({ day: key, count: map.get(key) ?? 0 })
  }
  return result
}

function MiniBarChart({ data, color = "#f97316", label, total }: {
  data: DayCount[]; color?: string; label: string; total?: number
}) {
  const W = 400
  const H = 88
  const PAD_T = 14
  const PAD_B = 20
  const GAP = 3
  const filled = fillDays(data)
  const maxVal = Math.max(...filled.map((d) => d.count), 1)
  const n = filled.length
  const barW = (W - GAP * (n - 1)) / n
  const chartH = H - PAD_T - PAD_B

  const shortDay = (iso: string) => {
    const d = new Date(iso + "T12:00:00Z")
    return `${d.getUTCDate()}.${String(d.getUTCMonth() + 1).padStart(2, "0")}`
  }

  return (
    <div className="rounded-[20px] border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-baseline justify-between">
        <p className="text-sm font-semibold text-zinc-700">{label}</p>
        {total !== undefined && (
          <span className="text-xs font-medium text-zinc-400">всего {total.toLocaleString("ru")}</span>
        )}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ overflow: "visible" }}>
        {filled.map((d, i) => {
          const x = i * (barW + GAP)
          const barH = d.count === 0 ? 2 : Math.max(4, (d.count / maxVal) * chartH)
          const y = PAD_T + chartH - barH
          const isLast = i === n - 1
          const showLabel = i === 0 || isLast || i === Math.floor(n / 2)
          return (
            <g key={d.day}>
              <rect x={x} y={y} width={barW} height={barH} rx={3}
                fill={d.count === 0 ? "#e4e4e7" : color}
                opacity={isLast ? 1 : 0.75}
              />
              {showLabel ? (
                <text x={x + barW / 2} y={H - 4} textAnchor="middle" fontSize="9" fill="#a1a1aa">
                  {shortDay(d.day)}
                </text>
              ) : null}
              {(d.count > 0 && isLast) ? (
                <text x={x + barW / 2} y={y - 3} textAnchor="middle" fontSize="10" fontWeight="600" fill={color}>
                  {d.count}
                </text>
              ) : null}
            </g>
          )
        })}
      </svg>
      <p className="mt-1 text-right text-xs text-zinc-400">14 дней</p>
    </div>
  )
}

export default async function AdminDashboardPage() {
  const ctx = await getAdminSession()
  if (!ctx || !hasAdminPermission(ctx.staff, "dashboard.view")) redirect("/admin/login")

  const showSensitive = hasAdminPermission(ctx.staff, "users.viewSensitive")
  const canViewUsers = hasAdminPermission(ctx.staff, "users.view")
  const canViewActivity =
    hasAdminPermission(ctx.staff, "activity.view") || hasAdminPermission(ctx.staff, "users.view")

  const [s, charts] = await Promise.all([getStats(), getChartData()])
  const permissions = expandPermissions(ctx.staff.role)

  const attentionStats: DashboardAttentionStats = {
    pendingModeration: s.pendingModeration,
    openReports: s.openReports,
    fraudReportsPending: s.fraudReportsPending,
    reviewQueueCount: s.reviewQueueCount,
    supportOperatorQueue: s.supportOperatorQueue,
    paymentsPending: s.paymentsPending,
    highRiskUsers: s.highRiskUsers,
    wantToBuyModeration: s.wantToBuyModeration,
    b2bPendingReview: s.b2bPendingReview,
  }

  return (
    <div className="min-h-full bg-zinc-50">
      <AdminPageShell>
        <AdminPageHeader
          title="Дашборд"
          description={
            <>
              Добро пожаловать,{" "}
              <span className="font-medium text-zinc-700">{ctx.staff.displayName ?? ctx.staff.login}</span>
            </>
          }
        />

        <AdminDashboardAttention stats={attentionStats} permissions={permissions} />

        {canViewActivity ? (
          <AdminDashboardActivity showSensitive={showSensitive} canViewUsers={canViewUsers} />
        ) : null}

        <div className="mt-8 grid grid-cols-2 gap-3 lg:gap-4 xl:grid-cols-4">
          <StatCard label="Пользователей"   value={s.totalUsers.toLocaleString("ru")}      sub={`+${s.newUsersToday} сегодня / +${s.newUsersWeek} за неделю`} />
          <StatCard label="Объявлений"      value={s.totalListings.toLocaleString("ru")}   sub={`${s.activeListings} активных`}   color="blue"   />
          <StatCard label="На модерации"    value={s.pendingModeration}                     sub="ждут проверки"                    color={s.pendingModeration > 0 ? "red" : "green"} />
          <StatCard label="Жалобы"          value={s.openReports}                           sub="открытых"                         color={s.openReports > 0 ? "red" : "green"} />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 lg:mt-6 lg:gap-4 xl:grid-cols-4">
          <StatCard label="Жалобы: мошенничество" value={s.fraudReportsPending} sub="в статусе pending" color={s.fraudReportsPending > 0 ? "red" : "green"} />
          <StatCard label="Отзывы на проверке"   value={s.reviewQueueCount}   sub="модерация / споры" color={s.reviewQueueCount > 0 ? "orange" : "green"} />
          <StatCard label="Профили HIGH_RISK"    value={s.highRiskUsers}       sub="по внутренней модели" color={s.highRiskUsers > 0 ? "red" : "green"} />
          <StatCard label="Поддержка: оператор"  value={s.supportOperatorQueue} sub="ожидают ответа" color={s.supportOperatorQueue > 0 ? "orange" : "green"} />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 lg:mt-6 lg:gap-4 xl:grid-cols-4">
          <StatCard label="Платежи pending" value={s.paymentsPending}                    sub="нужна проверка" color={s.paymentsPending > 0 ? "orange" : "green"} />
          <StatCard label="Платежей всего"  value={s.totalPayments.toLocaleString("ru")} color="green" />
          <StatCard label="Платежей (7 дн)" value={s.recentPayments.toLocaleString("ru")} color="green" />
        </div>

        <div className="mt-8">
          <h2 className="mb-4 text-base font-semibold text-zinc-700">Динамика за 14 дней</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <MiniBarChart data={charts.users}    color="#f97316" label="Новые пользователи"  total={s.totalUsers} />
            <MiniBarChart data={charts.listings} color="#3b82f6" label="Новые объявления"     total={s.totalListings} />
            <MiniBarChart data={charts.payments} color="#10b981" label="Успешные платежи"     total={s.recentPayments} />
          </div>
        </div>

      </AdminPageShell>
    </div>
  )
}
