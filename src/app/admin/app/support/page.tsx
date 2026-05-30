import { AdminSupportWorkspace } from "@/components/admin/support/AdminSupportWorkspace"
import { StaffAppGate } from "@/components/admin/staff-app/StaffAppGate"

export default function StaffAppSupportPage() {
  return (
    <StaffAppGate requireSupport>
      <AdminSupportWorkspace staffApp />
    </StaffAppGate>
  )
}
