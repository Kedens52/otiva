"use client"

import { usePathname } from "next/navigation"
import { LegalTocPanel as LegalTocPanelBase } from "@/components/legal/LegalToc"
import { LEGAL_LINKS } from "@/lib/legal-meta"

export function LegalTocPanelEnabled() {
  const pathname = usePathname() ?? ""
  const enabled = pathname.startsWith("/legal") && pathname !== LEGAL_LINKS.index
  return <LegalTocPanelBase enabled={enabled} />
}
