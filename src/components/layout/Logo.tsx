import Image from "next/image"
import Link from "next/link"

type LogoProps = {
  compact?: boolean
}

export function Logo({ compact = false }: LogoProps) {
  return (
    <Link href="/feed" className="inline-flex items-center" aria-label="Нашло">
      <Image
        src="/nashlo-logo.svg"
        alt="Нашло"
        width={2096}
        height={236}
        priority={!compact}
        className={compact ? "h-5 w-auto" : "h-8 w-auto sm:h-9"}
      />
    </Link>
  )
}
