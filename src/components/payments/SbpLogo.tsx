import Image from "next/image"

type SbpLogoProps = {
  className?: string
}

/** Официальный логотип СБП (сбп / система быстрых платежей) */
export function SbpLogo({ className = "h-10 w-auto max-w-[120px] object-contain" }: SbpLogoProps) {
  return (
    <Image
      src="/payments/sbp-logo.png"
      alt="Система быстрых платежей"
      width={320}
      height={96}
      className={className}
      unoptimized
      priority={false}
    />
  )
}
