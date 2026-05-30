import type { Metadata } from "next"
import { BusinessDashboardLayout } from "@/components/business/BusinessDashboardLayout"

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function BusinessDashboardRouteLayout({ children }: { children: React.ReactNode }) {
  return <BusinessDashboardLayout>{children}</BusinessDashboardLayout>
}
