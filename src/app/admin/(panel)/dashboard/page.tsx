import { redirect } from "next/navigation"
import { getAdminSession } from "@/lib/admin/adminSession"
import { hasAdminPermission } from "@/lib/admin/permissions"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

async function getStats() {
  const now   = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const week  = new Date(today.getTime() - 7 * 86400_000)

  const [
    totalUsers, newUsersToday, newUsersWeek,
    totalListings, pendingModeration, activeListings,
    totalPayments, recentPayments,
    openReports,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: today } } }),
    prisma.user.count({ where: { createdAt: { gte: week  } } }),
    prisma.listing.count(),
    prisma.listing.count({ where: { status: "MODERATION" } }),
    prisma.listing.count({ where: { status: "ACTIVE"     } }),
    prisma.payment.count(),
    prisma.payment.count({ where: { createdAt: { gte: week }, status: "paid" } }),
    prisma.report.count({ where: { status: "pending" } }),
  ])

  return {
    totalUsers, newUsersToday, newUsersWeek,
    totalListings, pendingModeration, activeListings,
    totalPayments, recentPayments,
    openReports,
  }
}

function StatCard({
  label, value, sub, color = "orange",
}: {
  label: string; value: number | string; sub?: string; color?: string
}) {
  const colors: Record<string, string> = {
    orange: "text-orange-400",
    red:    "text-red-400",
    green:  "text-green-400",
    blue:   "text-blue-400",
  }
  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">{label}</p>
      <p className={`text-3xl font-bold ${colors[color] ?? colors.orange}`}>{value}</p>
      {sub && <p className="text-xs text-gray-600 mt-1">{sub}</p>}
    </div>
  )
}

export default async function AdminDashboardPage() {
  const ctx = await getAdminSession()
  if (!ctx || !hasAdminPermission(ctx.staff, "dashboard.view")) redirect("/admin/login")

  const s = await getStats()

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Дашборд</h1>
        <p className="text-gray-500 text-sm mt-1">
          Добро пожаловать,{" "}
          <span className="text-gray-300">{ctx.staff.displayName ?? ctx.staff.login}</span>
        </p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatCard label="Пользователей"   value={s.totalUsers.toLocaleString("ru")}      sub={`+${s.newUsersToday} сегодня / +${s.newUsersWeek} за неделю`} />
        <StatCard label="Объявлений"      value={s.totalListings.toLocaleString("ru")}   sub={`${s.activeListings} активных`}   color="blue"   />
        <StatCard label="На модерации"    value={s.pendingModeration}                     sub="ждут проверки"                    color={s.pendingModeration > 0 ? "red" : "green"} />
        <StatCard label="Жалобы"          value={s.openReports}                           sub="открытых"                         color={s.openReports > 0 ? "red" : "green"} />
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Платежей всего"  value={s.totalPayments.toLocaleString("ru")}   color="green" />
        <StatCard label="Платежей (7 дн)" value={s.recentPayments.toLocaleString("ru")}  color="green" />
      </div>
    </div>
  )
}
