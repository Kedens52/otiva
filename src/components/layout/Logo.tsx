import Link from "next/link"
import { NashloLogoMark } from "@/components/layout/NashloLogoMark"

type LogoSize = "compact" | "default" | "header"

type LogoProps = {
  /** @deprecated используйте size="compact" */
  compact?: boolean
  size?: LogoSize
}

const SIZE_CLASS: Record<LogoSize, string> = {
  compact: "h-8 w-8 sm:h-9 sm:w-9",
  default: "h-10 w-10 sm:h-11 sm:w-11",
  header: "h-10 w-10 lg:h-11 lg:w-11",
}

export function Logo({ compact = false, size }: LogoProps) {
  const resolvedSize: LogoSize = size ?? (compact ? "compact" : "default")

  return (
    <Link
      href="/"
      className="inline-flex shrink-0 items-center overflow-visible"
      aria-label="OTIVA — на главную"
    >
      <NashloLogoMark className={SIZE_CLASS[resolvedSize]} />
    </Link>
  )
}
