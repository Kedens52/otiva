import { Suspense } from "react"
import { StaffAppLoginForm } from "@/components/admin/staff-app/StaffAppLoginForm"

export default function StaffAppLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-zinc-950">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-orange-500" />
        </div>
      }
    >
      <StaffAppLoginForm />
    </Suspense>
  )
}
