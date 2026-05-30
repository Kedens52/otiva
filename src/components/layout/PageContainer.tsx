import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

export const PAGE_CONTAINER_CLASS = "mx-auto w-full max-w-[1280px] px-4 sm:px-5 lg:px-6"
export const PAGE_CONTAINER_WIDE_CLASS = "mx-auto w-full max-w-[1360px] px-4 sm:px-5 lg:px-6"

interface PageContainerProps {
  children: ReactNode
  className?: string
  /** wide=true → max-w-[1360px], default → max-w-[1280px] */
  wide?: boolean
  /** noPad=true → no vertical padding (page controls its own) */
  noPad?: boolean
}

/**
 * Unified page container for all public and account pages.
 * Desktop: max-width 1280/1320px, px-6
 * Tablet: px-5
 * Mobile: px-4
 */
export function PageContainer({
  children,
  className,
  wide = false,
  noPad = false,
}: PageContainerProps) {
  return (
    <div
      className={cn(
        wide ? PAGE_CONTAINER_WIDE_CLASS : PAGE_CONTAINER_CLASS,
        !noPad && "py-5 lg:py-8",
        className,
      )}
    >
      {children}
    </div>
  )
}
