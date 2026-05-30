import type { ReactNode } from "react"
import { LegalRouteLayout } from "@/components/legal/LegalRouteLayout"

export default function LegalSectionLayout({ children }: { children: ReactNode }) {
  return <LegalRouteLayout>{children}</LegalRouteLayout>
}
