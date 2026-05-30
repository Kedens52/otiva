"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Building2, ChevronRight } from "lucide-react"

/** Небольшая карточка в личном /profile — не бизнес-кабинет, только ссылка. */
export function ProfileBusinessTeaser() {
  const [hasBusiness, setHasBusiness] = useState<boolean | null>(null)

  useEffect(() => {
    fetch("/api/business/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setHasBusiness(Boolean(data?.hasBusinessProfile)))
      .catch(() => setHasBusiness(false))
  }, [])

  if (hasBusiness === null) return null

  return (
    <section className="rounded-[20px] border border-orange-100/80 bg-gradient-to-br from-[#FFF8F3] to-white p-4 shadow-[0_2px_12px_rgba(15,23,42,0.04)] lg:rounded-2xl lg:p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[hsl(var(--nashlo-orange)/0.12)]">
          <Building2 className="h-5 w-5 text-[hsl(var(--nashlo-orange))]" strokeWidth={1.75} />
        </span>
        <div className="min-w-0 flex-1">
          {hasBusiness ? (
            <>
              <h2 className="text-[15px] font-semibold text-zinc-950 lg:text-base">У вас есть бизнес-профиль</h2>
              <p className="mt-1 text-sm text-zinc-600">
                B2B-кабинет отделён от личного профиля — объявления и настройки компании там.
              </p>
              <Link
                href="/business/dashboard"
                className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[hsl(var(--nashlo-orange))]"
              >
                Перейти в Нашло Бизнес
                <ChevronRight className="h-4 w-4" strokeWidth={2} />
              </Link>
            </>
          ) : (
            <>
              <h2 className="text-[15px] font-semibold text-zinc-950 lg:text-base">Работаете как компания?</h2>
              <p className="mt-1 text-sm text-zinc-600">
                Создайте бизнес-профиль на отдельной площадке — личный кабинет не изменится.
              </p>
              <Link
                href="/business/register"
                className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[hsl(var(--nashlo-orange))]"
              >
                Создать бизнес-профиль
                <ChevronRight className="h-4 w-4" strokeWidth={2} />
              </Link>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
