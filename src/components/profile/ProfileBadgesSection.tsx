"use client"

import type { PublicUserBadge } from "@/lib/badges/badge-map"
import { UserBadges } from "@/components/profile/UserBadges"
import { cn } from "@/lib/utils"

type Props = {
  badges?: PublicUserBadge[] | null
  /** Показать «Пока нет значков» если массив пуст */
  showEmpty?: boolean
  /** Горизонтальная лента значков (мобильный профиль) */
  scrollRow?: boolean
  className?: string
}

export function ProfileBadgesSection({ badges, showEmpty = false, scrollRow = false, className }: Props) {
  const list = badges ?? []

  if (!list.length && !showEmpty) return null

  return (
    <div className={cn(scrollRow ? "mt-3" : "mt-3", className)}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-zinc-400">Значки</p>
      {list.length > 0 ? (
        <>
          <UserBadges
            badges={list}
            variant={scrollRow ? "scrollRow" : "icons"}
            size="md"
            className={cn("mt-2", scrollRow && "lg:hidden")}
          />
          {scrollRow ? (
            <UserBadges badges={list} variant="icons" size="md" className="mt-2 hidden lg:inline-flex" />
          ) : null}
        </>
      ) : (
        <p className="mt-2 text-sm text-zinc-400">Пока нет значков</p>
      )}
    </div>
  )
}
