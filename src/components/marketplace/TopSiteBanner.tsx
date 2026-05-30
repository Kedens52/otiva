"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { PAGE_CONTAINER_WIDE_CLASS } from "@/components/layout/PageContainer"

type SiteBanner = {
  id: string
  title: string
  linkText: string | null
  href: string
  image: string | null
  imageOnly?: boolean
  bgFrom: string
  bgTo: string
}

const dismissedIdKey = "nashlo-top-banner-dismissed-for-id"

function BannerLink({
  href,
  isInternal,
  className,
  children,
  onNavigate,
}: {
  href: string
  isInternal: boolean
  className: string
  children: React.ReactNode
  onNavigate?: () => void
}) {
  if (isInternal) {
    return (
      <Link href={href} className={className} onClick={onNavigate}>
        {children}
      </Link>
    )
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className} onClick={onNavigate}>
      {children}
    </a>
  )
}

export function TopSiteBanner() {
  const [apiBanner, setApiBanner] = useState<SiteBanner | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || typeof window === "undefined") return

    fetch("/api/site-banner")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        setApiBanner(data?.banner ?? null)
        setLoaded(true)
      })
      .catch(() => {
        setApiBanner(null)
        setLoaded(true)
      })
  }, [mounted])

  useEffect(() => {
    if (!mounted || !loaded || typeof window === "undefined") return
    const dismissedFor = localStorage.getItem(dismissedIdKey)
    const currentId = apiBanner?.id ?? "default"
    setHidden(dismissedFor === currentId)
  }, [mounted, loaded, apiBanner?.id])

  if (hidden) return null

  if (!mounted || !loaded) {
    return (
      <div className="relative z-40 border-b border-zinc-200/80 bg-white/85">
        <div className={`${PAGE_CONTAINER_WIDE_CLASS} flex h-10 items-center justify-center px-10 sm:h-11 sm:px-12`}>
          <div className="h-3 w-full max-w-xl animate-pulse rounded-full bg-zinc-200/80" />
        </div>
      </div>
    )
  }

  function dismiss() {
    const id = apiBanner?.id ?? "default"
    localStorage.setItem(dismissedIdKey, id)
    setHidden(true)
  }

  const useAdmin = Boolean(apiBanner?.title?.trim() || apiBanner?.image?.trim())
  const href = apiBanner?.href?.trim() || "/"
  const isInternal = href.startsWith("/")
  const imageOnly = Boolean(apiBanner?.imageOnly && apiBanner?.image)

  if (useAdmin && imageOnly) {
    return (
      <div className="relative z-40 border-b border-zinc-200/80 bg-zinc-100">
        <div className={`${PAGE_CONTAINER_WIDE_CLASS} relative px-0 sm:px-0 lg:px-0`}>
          <BannerLink
            href={href}
            isInternal={isInternal}
            className="block w-full"
            onNavigate={dismiss}
          >
            <img
              src={apiBanner!.image!}
              alt={apiBanner!.title || "Реклама"}
              className="block h-10 w-full object-cover object-center sm:h-12 md:h-14"
              decoding="async"
            />
          </BannerLink>
          <button
            type="button"
            onClick={dismiss}
            className="absolute right-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-lg font-light text-white backdrop-blur-sm transition hover:bg-black/55"
            aria-label="Скрыть баннер"
          >
            ×
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="relative z-40 border-b border-zinc-200/80 bg-white/85 text-zinc-700 shadow-[0_1px_0_rgba(255,255,255,0.7)] backdrop-blur"
      style={
        useAdmin
          ? { background: `linear-gradient(90deg, ${apiBanner!.bgFrom}, ${apiBanner!.bgTo})` }
          : { background: "linear-gradient(90deg, hsl(0 0% 100%), hsl(24 100% 97%))" }
      }
    >
      <div className={`${PAGE_CONTAINER_WIDE_CLASS} relative flex min-h-10 items-center justify-center gap-2 px-10 py-1.5 sm:min-h-11 sm:px-12 md:min-h-12`}>
        {useAdmin ? (
          <>
            {apiBanner!.image ? (
              <BannerLink
                href={href}
                isInternal={isInternal}
                className="absolute inset-0 z-0"
                onNavigate={dismiss}
              >
                <img
                  src={apiBanner!.image!}
                  alt=""
                  className="h-full w-full object-cover object-right opacity-90"
                  decoding="async"
                />
              </BannerLink>
            ) : null}
            <div className="relative z-[1] min-w-0 px-2">
              {isInternal ? (
                <Link
                  href={href}
                  className="min-w-0 text-xs font-semibold text-zinc-950 transition hover:opacity-95 sm:text-sm"
                  onClick={dismiss}
                >
                  <span className="line-clamp-2 sm:line-clamp-1">{apiBanner!.title}</span>
                  {apiBanner!.linkText ? (
                    <span className="ml-1.5 underline underline-offset-2">{apiBanner!.linkText}</span>
                  ) : null}
                </Link>
              ) : (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-w-0 text-xs font-semibold text-zinc-950 transition hover:opacity-95 sm:text-sm"
                  onClick={dismiss}
                >
                  <span className="line-clamp-2 sm:line-clamp-1">{apiBanner!.title}</span>
                  {apiBanner!.linkText ? (
                    <span className="ml-1.5 underline underline-offset-2">{apiBanner!.linkText}</span>
                  ) : null}
                </a>
              )}
            </div>
          </>
        ) : (
          <div className="flex max-w-4xl flex-col gap-2 pr-9 sm:flex-row sm:items-center sm:gap-0">
            <p className="text-xs font-medium leading-snug text-zinc-700 sm:text-sm">
              <span className="hidden sm:inline">
                Первые объявления — бесплатно. Сейчас развиваем Нашло для людей, дальше — инструменты для бизнеса.
              </span>
              <span className="sm:hidden">
                Первые объявления — бесплатно. Бизнес-возможности добавим позже.
              </span>
            </p>
            <Link
              href="/create"
              className="inline-flex w-fit shrink-0 items-center justify-center rounded-lg bg-zinc-900/90 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-zinc-800 sm:ml-3 sm:px-3 sm:py-0.5 sm:text-xs"
              onClick={dismiss}
            >
              Разместить
            </Link>
          </div>
        )}
        <button
          type="button"
          onClick={dismiss}
          className="absolute right-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-lg font-light text-zinc-500 transition hover:bg-zinc-200/60"
          aria-label="Скрыть плашку"
        >
          ×
        </button>
      </div>
    </div>
  )
}
