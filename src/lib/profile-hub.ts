import type { PublicUserBadge } from "@/lib/badges/badge-map"
import { sortBadgesByPriority } from "@/lib/badges/badge-map"

export const TRUST_TIER_LABELS: Record<string, { title: string; desc: string }> = {
  NEW: { title: "Новый аккаунт", desc: "Заполните профиль и получите первые отзывы" },
  NORMAL: { title: "Обычный уровень", desc: "Стандартный уровень сервиса" },
  TRUSTED: { title: "Надёжный продавец", desc: "Высокий уровень доверия" },
  WATCH: { title: "На проверке", desc: "Модерация следит за качеством объявлений" },
  HIGH_RISK: { title: "Ограничен", desc: "Есть ограничения на публикации" },
  BLOCKED: { title: "Заблокирован", desc: "Аккаунт ограничен" },
}

const RESTRICTED_TRUST_TIERS = new Set(["BLOCKED", "HIGH_RISK", "WATCH"])

export type ProfileLevelDisplay = {
  title: string
  desc: string
  icon?: string
  /** Откуда взяли подпись — для отладки / будущего UI */
  source: "badge" | "trust"
}

/**
 * Карточка «Уровень» в кабинете: при выданных значках показываем лучший значок, иначе — уровень из trustTier.
 */
export function resolveProfileLevelDisplay(
  trustTier: string | null | undefined,
  badges: PublicUserBadge[] | undefined,
): ProfileLevelDisplay {
  // Prefer badge-based level if user has badges
  if (badges && badges.length > 0) {
    const sorted = sortBadgesByPriority(badges)
    const top = sorted[0]
    if (top) {
      return {
        title: top.title,
        desc: top.description ?? "",
        icon: top.icon ?? undefined,
        source: "badge",
      }
    }
  }
  // Fall back to trust tier
  const tier = trustTier ?? "NEW"
  const restricted = RESTRICTED_TRUST_TIERS.has(tier)
  const label = TRUST_TIER_LABELS[tier] ?? TRUST_TIER_LABELS["NEW"]!
  return {
    title: restricted ? label.title : label.title,
    desc: label.desc,
    source: "trust",
  }
}

export function formatJoinedYear(createdAt: string): string {
  return new Date(createdAt).getFullYear().toString()
}

export function formatProfileNumber(id: string): string {
  // Use last 6 chars of ID as a display number
  const short = id.replace(/-/g, "").slice(-6).toUpperCase()
  return short
}

export function formatWalletBalance(balance: number): string {
  return `${balance.toLocaleString("ru-RU")} ₽`
}

export function profileTypeLabel(profileType?: string | null): string {
  switch (profileType) {
    case "BUSINESS": return "Бизнес"
    case "PRIVATE": return "Частное лицо"
    default: return "Частное лицо"
  }
}
