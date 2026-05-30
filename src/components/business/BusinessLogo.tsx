import Link from "next/link"
import { NashloLogoMark } from "@/components/layout/NashloLogoMark"
import { cn } from "@/lib/utils"

type Props = {
  /** Компактный вариант для мобильной шапки */
  compact?: boolean
  className?: string
}

/**
 * Логотип «Нашло» без изменений + бейдж «Бизнес».
 */
export function BusinessLogo({ compact, className }: Props) {
  return (
    <Link
      href="/business"
      className={cn("inline-flex min-w-0 items-center gap-2", className)}
      aria-label="Нашло Бизнес — на главную"
    >
      <NashloLogoMark
        className={cn(
          "shrink-0",
          compact ? "h-7 w-7" : "h-9 w-9 sm:h-10 sm:w-10",
        )}
      />
      <span
        className={cn(
          "shrink-0 rounded-full border border-zinc-200/90 bg-white font-semibold tracking-tight text-zinc-700 shadow-[0_1px_2px_rgba(15,23,42,0.04)]",
          compact ? "px-1.5 py-0.5 text-[9px]" : "px-2.5 py-1 text-[11px] sm:text-xs",
        )}
      >
        Бизнес
      </span>
    </Link>
  )
}
