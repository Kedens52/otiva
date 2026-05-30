"use client"
import Link from 'next/link'

interface ProfileHeaderProps {
  name:         string | null
  avatar:       string | null
  profileType:  string
  city:         string | null
  createdAt:    string
  isVerified:   boolean
  rating:       number
  reviewCount:  number
}

export function ProfileHeader({ name, avatar, profileType, city, createdAt, isVerified, rating, reviewCount }: ProfileHeaderProps) {
  const initials = (name ?? 'П')[0].toUpperCase()
  const joined   = new Date(createdAt).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })
  const typeLabel = profileType === 'COMPANY' ? 'Продавец' : 'Частное лицо'

  return (
    <div className="flex flex-col gap-4 min-[420px]:flex-row min-[420px]:items-start">
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-[hsl(var(--nashlo-orange))]">
        {avatar
          ? <img src={avatar} alt="" className="h-full w-full object-cover" />
          : <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-white">{initials}</div>
        }
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="min-w-0 truncate text-xl font-bold text-zinc-950">{name ?? 'Пользователь Нашло'}</h1>
          {isVerified && <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">✓ Верифицирован</span>}
        </div>
        <p className="mt-0.5 text-sm text-zinc-500">{typeLabel}{city ? ` · ${city}` : ''}</p>
        <div className="mt-1 flex items-center gap-3 text-xs text-zinc-400">
          {reviewCount > 0 && (
            <span className="flex items-center gap-1">
              <span className="text-[hsl(var(--nashlo-orange))]">★</span>
              <span className="font-semibold text-zinc-700">{rating.toFixed(1)}</span>
              <span>({reviewCount})</span>
            </span>
          )}
          <span>На сайте с {joined}</span>
        </div>
      </div>
      <Link href="/profile/settings" className="w-full shrink-0 rounded-xl border border-zinc-200 px-3 py-2 text-center text-xs font-medium text-zinc-600 hover:bg-zinc-50 min-[420px]:w-auto min-[420px]:py-1.5">
        Изменить
      </Link>
    </div>
  )
}
