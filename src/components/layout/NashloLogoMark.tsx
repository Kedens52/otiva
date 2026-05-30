import Image from "next/image"
import { cn } from "@/lib/utils"
import {
  SITE_LOGO_MARK_HEIGHT,
  SITE_LOGO_MARK_SRC,
  SITE_LOGO_MARK_WIDTH,
} from "@/config/site-logo"

type NashloLogoMarkProps = {
  className?: string
}

export function NashloLogoMark({ className }: NashloLogoMarkProps) {
  return (
    <Image
      src={SITE_LOGO_MARK_SRC}
      alt=""
      width={SITE_LOGO_MARK_WIDTH}
      height={SITE_LOGO_MARK_HEIGHT}
      aria-hidden
      priority
      className={cn("block shrink-0 object-contain object-center", className)}
    />
  )
}
