import type { ReactNode } from "react"
import { LegalPageShellInner } from "@/components/legal/LegalPageShellInner"

export function LegalPageShell({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <LegalPageShellInner title={title} description={description}>
      {children}
    </LegalPageShellInner>
  )
}
