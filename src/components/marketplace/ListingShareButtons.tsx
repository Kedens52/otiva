"use client"

import { useState } from "react"
import { buildMaxShareUrl, buildVkShareUrl } from "@/lib/bonuses/hooks"

type Props = {
  listingId: string
  title: string
  shareUrl: string
  /** Только владелец получает баллы за шаринг */
  isOwner?: boolean
  className?: string
}

/** Минимальное время в мс которое попап должен быть открыт для начисления баллов */
const MIN_DWELL_MS = 3000

export function ListingShareButtons({ listingId, title, shareUrl, isOwner, className }: Props) {
  const [copied, setCopied] = useState(false)
  const [bonusMsg, setBonusMsg] = useState<string | null>(null)
  const [sharing, setSharing] = useState<"VK" | "MAX" | null>(null)

  async function trackShare(platform: "VK" | "MAX") {
    // 1. Сразу открываем попап
    const url = platform === "VK" ? buildVkShareUrl(shareUrl, title) : buildMaxShareUrl(shareUrl)
    const popup = window.open(url, "_blank", "width=700,height=500")

    // Если попап заблокирован браузером — открываем в новой вкладке без баллов
    if (!popup) {
      window.open(url, "_blank", "noopener,noreferrer")
      return
    }

    // Не владелец — попап открыли, баллы не начисляем
    if (!isOwner) return

    // 2. Опрашиваем попап каждые 500мс — ждём когда закроется
    setSharing(platform)
    const openedAt = Date.now()

    const interval = setInterval(async () => {
      try {
        if (!popup.closed) return // Ещё открыт
      } catch {
        // cross-origin — значит попап всё еще открыт, продолжаем опрос
        return
      }

      // Попап закрыт
      clearInterval(interval)
      setSharing(null)
      const dwell = Date.now() - openedAt

      if (dwell < MIN_DWELL_MS) {
        // Попап закрыли слишком быстро — баллы не засчитываем
        setBonusMsg("Поделитесь и немного подождите — баллы не засчитаны")
        setTimeout(() => setBonusMsg(null), 3000)
        return
      }

      // 3. Попап был открыт достаточно долго — записываем шаринг
      try {
        const res = await fetch("/api/share", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ listingId, platform }),
        })
        const data = await res.json()
        if (data.bonus?.ok && data.bonus.points) {
          setBonusMsg(`+${data.bonus.points} баллов`)
        } else if (data.bonus?.message) {
          setBonusMsg(data.bonus.message)
        }
        setTimeout(() => setBonusMsg(null), 3500)
      } catch {}
    }, 500)

    // Сброс поллинга через 5 минут
    setTimeout(() => { clearInterval(interval); setSharing(null) }, 300_000)
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  return (
    <div className={className}>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => trackShare("VK")}
          disabled={sharing !== null}
          className="rounded-xl border border-[#0077FF]/30 bg-[#0077FF]/5 px-3 py-2 text-xs font-semibold text-[#0077FF] hover:bg-[#0077FF]/10 disabled:opacity-60"
        >
          {sharing === "VK" ? "Ожидаемся…" : "Поделиться ВКонтакте"}
        </button>
        <button
          type="button"
          onClick={() => trackShare("MAX")}
          disabled={sharing !== null}
          className="rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-800 hover:bg-violet-100 disabled:opacity-60"
        >
          {sharing === "MAX" ? "Ожидаемся…" : "Поделиться в МАХ"}
        </button>
        <button
          type="button"
          onClick={copyLink}
          className="rounded-xl border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-50"
        >
          {copied ? "Скопировано" : "Скопировать ссылку"}
        </button>
      </div>
      {isOwner && (
        <p className="mt-1 text-xs text-zinc-400">
          Баллы начисляются после того как вы поделились
        </p>
      )}
      {bonusMsg ? <p className="mt-1.5 text-xs text-emerald-600">{bonusMsg}</p> : null}
    </div>
  )
}
