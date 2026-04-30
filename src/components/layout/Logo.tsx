import Image from "next/image"
import Link from "next/link"

type LogoProps = {
  compact?: boolean
}

export function Logo({ compact = false }: LogoProps) {
  return (
    <Link href="/feed" className="inline-flex items-center" aria-label="Otiva">
      <Image
        src="/otiva-logo.svg"
        alt="Otiva"
        width={1433}
        height={376}
        priority={!compact}
        className={compact ? "h-5 w-auto" : "h-8 w-auto sm:h-9"}
      />
    </Link>
  )
}
