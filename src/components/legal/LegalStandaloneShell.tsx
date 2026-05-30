import type { ReactNode } from "react"
import { PAGE_CONTAINER_CLASS } from "@/components/layout/PageContainer"
import { cn } from "@/lib/utils"

type Props = {
  children: ReactNode
  /** wide=true → max-w-5xl (карта сайта и т.п.) */
  wide?: boolean
  className?: string
}

/** Оболочка для legal-страниц вне /legal: единые отступы и max-width. */
export function LegalStandaloneShell({ children, wide = false, className }: Props) {
  return (
    <main className={cn(PAGE_CONTAINER_CLASS, "py-12 pb-28 lg:pb-12", className)}>
      <div className={cn("mx-auto w-full min-w-0", wide ? "max-w-5xl" : "max-w-3xl")}>{children}</div>
    </main>
  )
}
