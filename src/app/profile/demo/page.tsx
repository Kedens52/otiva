"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { listings } from "@/lib/mock-marketplace"
import { RatingSummary } from "@/components/reviews/RatingSummary"
import { ReviewCard } from "@/components/reviews/ReviewCard"
import type { Review } from "@/lib/mock-reviews"

type Profile = { name: string; phone: string; email: string; city: string; about: string }

const defaultProfile: Profile = {
  name: "Демо пользователь",
  phone: "+7 900 000-00-00",
  email: "demo@nashlo.ru",
  city: "Санкт-Петербург",
  about: "",
}

const DEMO_REVIEWS: Review[] = [
  { id: "dr1", author: "Кирилл Н.", avatar: "К", rating: 5, date: "10 апр 2025", text: "Отличный продавец! Всё чётко по описанию, быстро вышел на связь.", listingTitle: "Услуги дизайна", role: "buyer", helpful: 7 },
  { id: "dr2", author: "Юлия С.", avatar: "Ю", rating: 5, date: "22 мар 2025", text: "Очень приятная сделка. Продавец честный, без скрытых нюансов.", listingTitle: "Логотип для бизнеса", role: "buyer", helpful: 4 },
  { id: "dr3", author: "Артём В.", avatar: "А", rating: 4, date: "5 мар 2025", text: "Хорошо, но немного долго ждал ответа. В итоге всё решили.", listingTitle: "Услуги дизайна", role: "buyer", helpful: 2 },
  { id: "dr4", author: "Мария Ф.", avatar: "М", rating: 5, date: "14 фев 2025", text: "Всё идеально. Профессиональный подход. Спасибо!", listingTitle: "Фирменный стиль", role: "buyer", helpful: 11 },
]

const myListings = listings.slice(0, 6)

export default function DemoProfilePage() {
  const [profile, setProfile] = useState(defaultProfile)
  const [isOwner, setIsOwner] = useState(false)

  useEffect(() => {
    // Load profile from Supabase or localStorage demo
    async function load() {
      try {
        const { getSupabase } = await import("@/lib/supabase")
        const supabase = getSupabase()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setIsOwner(true)
          const { data } = await supabase
            .from("profiles")
            .select("name,phone,city")
            .eq("id", user.id)
            .single()
          if (data) setProfile({ ...defaultProfile, ...data })
          else setProfile({ ...defaultProfile, name: user.email?.split("@")[0] || "Пользователь", email: user.email || "" })
          return
        }
      } catch {}
      const stored = localStorage.getItem("nashlo-demo-user")
      if (stored) {
        setIsOwner(true)
        setProfile({ ...defaultProfile, ...JSON.parse(stored) })
      }
    }
    load()
  }, [])

  const initials = profile.name?.trim().slice(0, 1).toUpperCase() || "П"
  const avgRating = (DEMO_REVIEWS.reduce((s, r) => s + r.rating, 0) / DEMO_REVIEWS.length).toFixed(1)

  return (
    <main className="mx-auto max-w-5xl px-4 pb-24 pt-6 lg:py-10">

      {/* ── Profile header ─────────────────────────────── */}
      <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">
        {/* Cover */}
        <div className="h-28 bg-gradient-to-br from-[hsl(var(--nashlo-blue)/0.15)] via-zinc-100 to-[hsl(var(--nashlo-orange)/0.1)] lg:h-36" />

        <div className="relative px-5 pb-6 sm:px-8">
          {/* Avatar */}
          <div className="-mt-10 flex items-end justify-between gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-white bg-[hsl(var(--nashlo-orange))] text-2xl font-bold text-white shadow-sm lg:h-24 lg:w-24">
              {initials}
            </div>
            {isOwner && (
              <Link
                href="/profile/settings"
                className="mb-1 flex h-9 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50"
              >
                <span className="text-base">✎</span>
                Редактировать
              </Link>
            )}
          </div>

          {/* Name & info */}
          <div className="mt-4">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 lg:text-3xl">{profile.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-zinc-500">
              {profile.city && <span>⌖ {profile.city}</span>}
              <span>На Нашло с 2026 года</span>
              <span className="flex items-center gap-1 font-medium text-zinc-700">
                <span className="text-[hsl(var(--nashlo-orange))]">★</span>
                {avgRating} · {DEMO_REVIEWS.length} отзыва
              </span>
            </div>
            {profile.about && (
              <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-600">{profile.about}</p>
            )}
          </div>

          {/* Stats row */}
          <div className="mt-5 flex flex-wrap gap-6 border-t border-zinc-100 pt-5">
            {[
              { value: String(myListings.length), label: "объявлений" },
              { value: avgRating + " ★", label: "рейтинг" },
              { value: String(DEMO_REVIEWS.length), label: "отзывов" },
              { value: "< 1 ч", label: "время ответа" },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-xl font-semibold text-zinc-950">{s.value}</p>
                <p className="mt-0.5 text-xs text-zinc-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Listings ───────────────────────────────────── */}
      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-zinc-950">Объявления</h2>
          {isOwner && (
            <Link href="/my-listings" className="text-sm font-medium text-zinc-500 hover:text-zinc-950">
              Управлять →
            </Link>
          )}
        </div>

        {myListings.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-zinc-200 bg-zinc-50 py-16 text-center">
            <p className="text-zinc-400">Нет активных объявлений</p>
            {isOwner && (
              <Link href="/create" className="mt-4 inline-flex rounded-2xl bg-[hsl(var(--nashlo-orange))] px-5 py-2.5 text-sm font-semibold text-white">
                Разместить объявление
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {myListings.map((listing) => (
              <Link
                key={listing.id}
                href={`/listings/${listing.id}`}
                className="group overflow-hidden rounded-2xl border border-zinc-200 bg-white transition hover:border-zinc-300 hover:shadow-sm"
              >
                <div className="aspect-square overflow-hidden bg-zinc-100">
                  {true ? (
                    <img src={`/listings/${listing.category}.svg`} alt={listing.title} className="h-full w-full object-cover transition group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-3xl text-zinc-300">◻</div>
                  )}
                </div>
                <div className="p-3">
                  <p className="line-clamp-2 text-sm font-medium text-zinc-950">{listing.title}</p>
                  <p className="mt-1 text-sm font-semibold text-zinc-950">
                    {listing.price === 0 ? "Бесплатно" : new Intl.NumberFormat("ru-RU").format(listing.price) + " ₽"}
                  </p>
                  {listing.city && <p className="mt-1 text-xs text-zinc-400">{listing.city}</p>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ── Reviews ───────────────────────────────────── */}
      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-zinc-950">Отзывы</h2>
          <span className="rounded-full bg-zinc-100 px-3 py-1 text-sm font-semibold text-zinc-600">{DEMO_REVIEWS.length}</span>
        </div>

        <div className="mb-5 overflow-hidden rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <RatingSummary reviews={DEMO_REVIEWS} />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {DEMO_REVIEWS.map((r) => (
            <ReviewCard key={r.id} review={r} />
          ))}
        </div>
      </section>

    </main>
  )
}
