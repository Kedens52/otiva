"use client"

import type { ReactNode } from "react"
import { usePathname } from "next/navigation"
import { LegalLayout } from "@/components/legal/LegalLayout"
import { LEGAL_LINKS } from "@/lib/legal-meta"

export function LegalRouteLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const isIndex = pathname === LEGAL_LINKS.index

  return <LegalLayout isIndex={isIndex}>{children}</LegalLayout>
}
