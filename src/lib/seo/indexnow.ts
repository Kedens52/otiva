import { getPublicSiteOrigin } from "@/lib/seo/site"

const INDEXNOW_ENDPOINTS = [
  "https://yandex.com/indexnow",
  "https://api.indexnow.org/indexnow",
] as const

function indexNowKey(): string | null {
  const key = process.env.INDEXNOW_KEY?.trim()
  return key && key.length >= 8 ? key : null
}

export function getIndexNowKeyLocation(): string | null {
  const key = indexNowKey()
  if (!key) return null
  return `${getPublicSiteOrigin()}/${key}.txt`
}

/** Уведомляет Яндекс/Bing о новых или обновлённых URL (без текста на сайте). */
export async function submitIndexNowUrls(urls: string[]): Promise<void> {
  const key = indexNowKey()
  if (!key || urls.length === 0) return

  const origin = getPublicSiteOrigin()
  const host = new URL(origin).host
  const keyLocation = `${origin}/${key}.txt`
  const urlList = [...new Set(urls.map((u) => u.trim()).filter(Boolean))].slice(0, 100)

  const body = JSON.stringify({
    host,
    key,
    keyLocation,
    urlList,
  })

  await Promise.allSettled(
    INDEXNOW_ENDPOINTS.map(async (endpoint) => {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body,
        signal: AbortSignal.timeout(8000),
      })
      if (!res.ok && res.status !== 202) {
        console.warn(`[indexnow] ${endpoint} → ${res.status}`)
      }
    }),
  )
}
