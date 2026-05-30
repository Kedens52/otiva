"use client"

import { usePathname } from "next/navigation"
import { LegalToc, useLegalTocFromArticle } from "@/components/legal/LegalToc"
import { LEGAL_LINKS } from "@/lib/legal-meta"

/** Правая колонка: содержание документа (только desktop) */
export function LegalTocAside() {
  const pathname = usePathname() ?? ""
  const enabled = pathname.startsWith("/legal") && pathname !== LEGAL_LINKS.index
  const items = useLegalTocFromArticle(enabled)

  if (!enabled || items.length < 2) return null

  return <LegalToc items={items} />
}
