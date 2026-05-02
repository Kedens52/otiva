"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ListingCard } from "@/components/marketplace/ListingCard"
import type { AppListing } from "@/lib/listing-types"

type Seller = {
  id: string
  name: string | null
  avatar: string | null
  description: string | null
  city: string | null
  isVerified: boolean
  rating: number
  reviewCount: number
  createdAt: string
  listings: AppListing[]
  reviews: Array<{
    id: string; rating: number; text: string | null
    author: { id: string; name: string | null; avatar: string | null }
    createdAt: string
  }>
}

export default function PublicProfilePage({ params }: { params: { id: string } }) {
  const [seller, setSeller] = useState<Seller | null>(null)
  const [loading, setLoading] = useState(true)
  const [isOwn, setIsOwn] = useState(false)
  const [copied, setCopied] = useState(false)
  const [tab, setTab] = useState<"listings" | "reviews">("listings")

  useEffect(() => {
    fetch(`/api/profile/${params.id}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { setSeller(data?.seller ?? null); setLoading(false) })
      .catch(() => setLoading(false))

    fetch("/api/auth/me")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        const me = data?.user ?? data
        if (me?.id === params.id) setIsOwn(true)
      })
      .catch(() => {})
  }, [params.id])

  if (loading) return <div className="mx-auto max-w-7xl px-4 py-20 text-center text-sm text-zinc-400">&#1047;&#1072;&#1075;&#1088;&#1091;&#1079;&#1082;&#1072;&#8230;</div>
  if (!seller) return (
    <div className="mx-auto max-w-7xl px-4 py-20 text-center">
      <p className="text-2xl font-semibold text-zinc-950">&#1055;&#1088;&#1086;&#1076;&#1072;&#1074;&#1077;&#1094; &#1085;&#1077; &#1085;&#1072;&#1081;&#1076;&#1077;&#1085;</p>
    </div>
  )

  const initials = (seller.name ?? "П")[0].toUpperCase()
  const joinDate = new Date(seller.createdAt).toLocaleDateString("ru-RU", { month: "long", year: "numeric" })

  const shareButton = (
    <button
      onClick={async () => {
        try { await navigator.clipboard.writeText(window.location.href) } catch {}
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }}
      className="flex w-full items-center justify-center gap-2 rounded-2xl border border-zinc-200 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
        <polyline points="16 6 12 2 8 6"/>
        <line x1="12" y1="2" x2="12" y2="15"/>
      </svg>
      {copied ? "Скопировано &#10003;" : "Поделиться"}
    </button>
  )

  return (
    <main>
      {/* ── MOBILE HEADER (hidden on lg) ── */}
      <div className="lg:hidden">
        <div className="bg-white px-4 pb-4 pt-6">
          {/* Avatar + name row */}
          <div className="flex items-center gap-4">
            {seller.avatar ? (
              <img src={seller.avatar} alt="" className="h-20 w-20 shrink-0 rounded-full object-cover ring-4 ring-zinc-100" />
            ) : (
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-zinc-950 text-3xl font-semibold text-white">
                {initials}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-semibold leading-tight text-zinc-950">{seller.name ?? "Продавец"}</h1>
              {seller.city && <p className="mt-0.5 text-sm text-zinc-500">{seller.city}</p>}
              <p className="mt-0.5 text-xs text-zinc-400">На сайте с {joinDate}</p>
              {seller.reviewCount > 0 && (
                <div className="mt-1.5 flex items-center gap-1.5">
                  <span className="text-sm font-bold text-zinc-950">{seller.rating.toFixed(1)}</span>
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map((s) => (
                      <span key={s} className={`text-xs ${s <= Math.round(seller.rating) ? "text-[hsl(var(--nashlo-orange))]" : "text-zinc-200"}`}>&#9733;</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Verified badge */}
          {seller.isVerified && (
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
              &#10003; Проверенный продавец
            </div>
          )}

          {/* Description */}
          {seller.description && (
            <p className="mt-3 text-sm text-zinc-500">{seller.description}</p>
          )}

          {/* Stats row */}
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-2xl bg-zinc-50 p-3 text-center">
              <p className="text-xl font-semibold text-zinc-950">{seller.listings.length}</p>
              <p className="mt-0.5 text-xs text-zinc-500">объявлений</p>
            </div>
            <div className="rounded-2xl bg-zinc-50 p-3 text-center">
              <p className="text-xl font-semibold text-zinc-950">{seller.reviewCount}</p>
              <p className="mt-0.5 text-xs text-zinc-500">отзывов</p>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-3 flex flex-col gap-2">
            {isOwn ? (
              <>
                <Link
                  href="/profile/settings"
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-zinc-950 py-3 text-sm font-semibold text-white"
                >
                  &#9998; Редактировать профиль
                </Link>
                <Link
                  href="/create"
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-zinc-200 py-3 text-sm font-medium text-zinc-600"
                >
                  + Разместить объявление
                </Link>
              </>
            ) : (
              shareButton
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="sticky top-0 z-10 flex border-b border-zinc-200 bg-white">
          <button
            onClick={() => setTab("listings")}
            className={`flex-1 py-3 text-sm font-semibold transition ${tab === "listings" ? "border-b-2 border-zinc-950 text-zinc-950" : "text-zinc-400"}`}
          >
            Объявления
            {seller.listings.length > 0 && (
              <span className="ml-1.5 text-xs text-zinc-400">{seller.listings.length}</span>
            )}
          </button>
          <button
            onClick={() => setTab("reviews")}
            className={`flex-1 py-3 text-sm font-semibold transition ${tab === "reviews" ? "border-b-2 border-zinc-950 text-zinc-950" : "text-zinc-400"}`}
          >
            Отзывы
            {seller.reviews.length > 0 && (
              <span className="ml-1.5 text-xs text-zinc-400">{seller.reviews.length}</span>
            )}
          </button>
        </div>

        {/* Mobile tab content */}
        <div className="px-4 py-4">
          {tab === "listings" && (
            seller.listings.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-3xl">&#128230;</p>
                <p className="mt-3 text-sm text-zinc-400">Нет активных объявлений</p>
                {isOwn && (
                  <Link href="/create" className="mt-4 inline-flex items-center gap-1.5 rounded-2xl bg-zinc-950 px-5 py-2.5 text-sm font-semibold text-white">
                    + Разместить
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {seller.listings.map((l) => <ListingCard key={l.id} listing={l} compact />)}
              </div>
            )
          )}
          {tab === "reviews" && (
            seller.reviews.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-3xl">&#128172;</p>
                <p className="mt-3 text-sm text-zinc-400">Отзывов пока нет</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {seller.reviews.map((r) => (
                  <div key={r.id} className="rounded-[24px] border border-zinc-200 bg-white p-4">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-sm font-semibold">
                        {(r.author.name ?? "А")[0]}
                      </div>
                      <p className="font-semibold text-zinc-950">{r.author.name ?? "Аноним"}</p>
                    </div>
                    <div className="mt-2 flex gap-0.5">
                      {[1,2,3,4,5].map((s) => (
                        <span key={s} className={`text-sm ${s <= r.rating ? "text-[hsl(var(--nashlo-orange))]" : "text-zinc-200"}`}>&#9733;</span>
                      ))}
                    </div>
                    {r.text && <p className="mt-2 text-sm text-zinc-600">{r.text}</p>}
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>

      {/* ── DESKTOP LAYOUT (hidden on mobile) ── */}
      <div className="mx-auto hidden max-w-7xl px-4 py-8 lg:block lg:py-12">
        <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
          <aside className="space-y-4 lg:sticky lg:top-24 lg:h-fit">
            <div className="rounded-[32px] border border-zinc-200 bg-white p-6 shadow-sm">
              {seller.avatar ? (
                <img src={seller.avatar} alt="" className="h-20 w-20 rounded-full object-cover" />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-zinc-950 text-3xl font-semibold text-white">{initials}</div>
              )}
              <h1 className="mt-5 text-2xl font-semibold tracking-tight text-zinc-950">{seller.name ?? "Продавец"}</h1>
              {seller.city && <p className="mt-0.5 text-sm text-zinc-500">{seller.city}</p>}
              <p className="mt-0.5 text-sm text-zinc-400">На сайте с {joinDate}</p>

              {seller.reviewCount > 0 && (
                <div className="mt-4 flex items-center gap-2">
                  <span className="text-lg font-bold text-zinc-950">{seller.rating.toFixed(1)}</span>
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map((s) => (
                      <span key={s} className={`text-base ${s <= Math.round(seller.rating) ? "text-[hsl(var(--nashlo-orange))]" : "text-zinc-200"}`}>&#9733;</span>
                    ))}
                  </div>
                  <span className="text-sm text-zinc-500">({seller.reviewCount})</span>
                </div>
              )}

              {seller.isVerified && (
                <div className="mt-4 rounded-2xl bg-[hsl(var(--nashlo-mint)/0.12)] px-4 py-2.5 text-sm font-semibold text-[hsl(var(--nashlo-mint))]">&#10003; Проверенный продавец</div>
              )}

              {seller.description && (
                <p className="mt-4 text-sm text-zinc-500">{seller.description}</p>
              )}

              {isOwn ? (
                <div className="mt-4 flex flex-col gap-2">
                  <Link
                    href="/profile/settings"
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-zinc-950 py-2.5 text-sm font-semibold text-white hover:bg-zinc-700"
                  >
                    &#9998; Редактировать профиль
                  </Link>
                  <Link
                    href="/create"
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border border-zinc-200 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
                  >
                    + Разместить объявление
                  </Link>
                </div>
              ) : (
                shareButton
              )}

              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="rounded-2xl bg-zinc-50 p-3 text-center">
                  <p className="text-xl font-semibold text-zinc-950">{seller.listings.length}</p>
                  <p className="mt-0.5 text-xs text-zinc-500">объявлений</p>
                </div>
                <div className="rounded-2xl bg-zinc-50 p-3 text-center">
                  <p className="text-xl font-semibold text-zinc-950">{seller.reviewCount}</p>
                  <p className="mt-0.5 text-xs text-zinc-500">отзывов</p>
                </div>
              </div>
            </div>
          </aside>

          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-semibold tracking-tight text-zinc-950">Объявления продавца</h2>
              {seller.listings.length === 0 ? (
                <div className="mt-4 rounded-[24px] border border-zinc-200 bg-white p-10 text-center">
                  <p className="text-3xl">&#128230;</p>
                  <p className="mt-3 text-sm text-zinc-400">Нет активных объявлений</p>
                  {isOwn && (
                    <Link href="/create" className="mt-4 inline-flex items-center gap-1.5 rounded-2xl bg-zinc-950 px-5 py-2.5 text-sm font-semibold text-white">
                      + Разместить
                    </Link>
                  )}
                </div>
              ) : (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {seller.listings.map((l) => (
                    <ListingCard key={l.id} listing={l} />
                  ))}
                </div>
              )}
            </section>

            <section>
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-2xl font-semibold tracking-tight text-zinc-950">Отзывы</h2>
                <span className="rounded-full bg-zinc-100 px-3 py-1 text-sm font-semibold text-zinc-600">{seller.reviews.length}</span>
              </div>
              {seller.reviews.length === 0 ? (
                <div className="mt-4 rounded-[24px] border border-zinc-200 bg-white p-8 text-center">
                  <p className="text-4xl">&#128172;</p>
                  <p className="mt-3 font-semibold text-zinc-950">Отзывов пока нет</p>
                </div>
              ) : (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {seller.reviews.map((r) => (
                    <div key={r.id} className="rounded-[24px] border border-zinc-200 bg-white p-5">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-sm font-semibold">
                          {(r.author.name ?? "А")[0]}
                        </div>
                        <p className="font-semibold text-zinc-950">{r.author.name ?? "Аноним"}</p>
                      </div>
                      <div className="mt-2 flex gap-0.5">
                        {[1,2,3,4,5].map((s) => (
                          <span key={s} className={`text-sm ${s <= r.rating ? "text-[hsl(var(--nashlo-orange))]" : "text-zinc-200"}`}>&#9733;</span>
                        ))}
                      </div>
                      {r.text && <p className="mt-2 text-sm text-zinc-600">{r.text}</p>}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </main>
  )
}
