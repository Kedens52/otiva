import { redirect } from "next/navigation"
import { getAdminSession } from "@/lib/admin/adminSession"
import { hasAdminPermission, expandPermissions } from "@/lib/admin/permissions"
import { AdminSidebar } from "@/components/admin/AdminSidebar"
import { AdminLogoutButton } from "@/components/admin/AdminLogoutButton"

export const dynamic = "force-dynamic"

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getAdminSession()

  if (!ctx) {
    redirect("/admin/login")
  }

  if (!hasAdminPermission(ctx.staff, "admin.access")) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <p className="text-4xl font-bold text-red-500 mb-2">403</p>
          <p className="text-gray-400 text-sm leading-relaxed">
            Недостаточно прав для доступа к панели. Выйдите из текущей сессии и войдите под учётной записью с нужной ролью.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3">
            <AdminLogoutButton />
            <a href="/admin/login" className="text-sm text-orange-400 hover:underline">
              На страницу входа
            </a>
          </div>
        </div>
      </div>
    )
  }

  const permissions = expandPermissions(ctx.staff.role)

  return (
    <div className="flex min-h-screen bg-gray-950">
      <AdminSidebar
        displayName={ctx.staff.displayName}
        login={ctx.staff.login}
        role={ctx.staff.role}
        permissions={permissions}
      />
      <main className="flex-1 min-w-0 overflow-auto">
        {children}
      </main>
    </div>
  )
}
