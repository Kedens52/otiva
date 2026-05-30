import { BusinessSectionGuard } from "@/components/business/BusinessSectionGuard"
import { CompanyProfileEditor } from "@/components/business/dashboard/CompanyProfileEditor"

export default function BusinessDashboardCompanyPage() {
  return (
    <BusinessSectionGuard section="company">
      <CompanyProfileEditor />
    </BusinessSectionGuard>
  )
}
