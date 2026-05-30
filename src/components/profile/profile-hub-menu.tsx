import type { LucideIcon } from "lucide-react"
import {
  Heart,
  HelpCircle,
  LayoutList,
  Megaphone,
  MessageCircle,
  Rocket,
  Search,
  Settings,
  ShoppingBag,
  Star,
  Wallet,
} from "lucide-react"
import type { CabinetNavItem } from "@/config/cabinet-nav"

export type ProfileHubMenuIcon = LucideIcon

const ICON_BY_HREF: Record<string, ProfileHubMenuIcon> = {
  "/my-listings": LayoutList,
  "/profile/favorites": Heart,
  "/chat": MessageCircle,
  "/profile/reviews": Star,
  "/profile/promotion": Rocket,
  "/profile/bonuses": Wallet,
  "/profile/ads": Megaphone,
  "/profile/settings": Settings,
  "/profile/want-to-buy": ShoppingBag,
  "/profile/want-to-buy/offers": MessageCircle,
  "/profile/my-offers": Search,
  "/profile/finance": Wallet,
  "/support": HelpCircle,
}

export function profileHubMenuIcon(href: string): ProfileHubMenuIcon {
  return ICON_BY_HREF[href] ?? LayoutList
}

export type ProfileHubMenuRow = CabinetNavItem & {
  subtitle?: string
  badge?: number
  accent?: boolean
}
