"use client"

import type { ReactNode } from "react"
import { usePathname } from "next/navigation"
import { LegalDocumentPage } from "@/components/legal/LegalDocumentPage"

export function LegalPageShellInner({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: ReactNode
}) {
  const pathname = usePathname() ?? "/legal"

  return (
    <LegalDocumentPage title={title} description={description} href={pathname}>
      {children}
    </LegalDocumentPage>
  )
}
