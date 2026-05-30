import { cn } from "@/lib/utils"
import {
  getAdDisclosureMarkLabel,
  type AdDisclosureMark,
} from "@/lib/ads/disclosure-mark"

type AdMarkProps = {
  className?: string
  /** Пометка в углу: реклама или партнёр сервиса */
  kind?: AdDisclosureMark
}

/** Маленькая пометка в углу блока. Не использовать на полосе над шапкой (TopSiteBanner). */
export function AdMark({ className, kind = "ad" }: AdMarkProps) {
  const label = getAdDisclosureMarkLabel(kind)
  const isPartner = kind === "partner"

  return (
    <span
      className={cn(
        "pointer-events-none absolute left-2 top-2 z-[2] max-w-[calc(100%-1rem)] rounded px-1 py-px font-medium leading-none tracking-wide text-white/95 bg-black/40 backdrop-blur-[2px]",
        isPartner ? "text-[7px] normal-case" : "text-[8px] uppercase",
        className,
      )}
      aria-hidden
    >
      {label}
    </span>
  )
}
