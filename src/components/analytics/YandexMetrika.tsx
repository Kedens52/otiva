"use client"

import Script from "next/script"
import { usePathname, useSearchParams } from "next/navigation"
import { Suspense, useEffect, useRef, useState } from "react"
import {
  COOKIE_CONSENT_CHANGED_EVENT,
  hasAnalyticsConsent,
} from "@/lib/cookie-consent"

const METRIKA_ID = Number(process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID?.trim() || "109258445")

declare global {
  interface Window {
    ym?: (counterId: number, method: string, ...args: unknown[]) => void
  }
}

function hitCurrentPage(counterId: number) {
  if (typeof window.ym !== "function") return
  const url = window.location.href
  window.ym(counterId, "hit", url, { referer: document.referrer })
}

function YandexMetrikaTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const initialized = useRef(false)

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return

    if (!initialized.current) {
      initialized.current = true
      return
    }

    const timer = window.setTimeout(() => hitCurrentPage(METRIKA_ID), 120)
    return () => window.clearTimeout(timer)
  }, [pathname, searchParams])

  return null
}

function YandexMetrikaInner() {
  const pathname = usePathname()
  const [consent, setConsent] = useState(false)

  useEffect(() => {
    setConsent(hasAnalyticsConsent())
    const onConsent = () => setConsent(hasAnalyticsConsent())
    window.addEventListener(COOKIE_CONSENT_CHANGED_EVENT, onConsent)
    return () => window.removeEventListener(COOKIE_CONSENT_CHANGED_EVENT, onConsent)
  }, [])

  if (pathname.startsWith("/admin") || !consent) return null

  return (
    <>
      <Script id="yandex-metrika" strategy="afterInteractive">
        {`
(function(m,e,t,r,i,k,a){
  m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
  m[i].l=1*new Date();
  for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
  k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
})(window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js?id=${METRIKA_ID}', 'ym');

ym(${METRIKA_ID}, 'init', {
  ssr: true,
  webvisor: true,
  clickmap: true,
  ecommerce: 'dataLayer',
  referrer: document.referrer,
  url: location.href,
  accurateTrackBounce: true,
  trackLinks: true
});
`}
      </Script>
      <noscript>
        <div>
          <img
            src={`https://mc.yandex.ru/watch/${METRIKA_ID}`}
            style={{ position: "absolute", left: "-9999px" }}
            alt=""
          />
        </div>
      </noscript>
      <Suspense fallback={null}>
        <YandexMetrikaTracker />
      </Suspense>
    </>
  )
}

export function YandexMetrika() {
  if (!Number.isFinite(METRIKA_ID) || METRIKA_ID <= 0) return null

  return (
    <Suspense fallback={null}>
      <YandexMetrikaInner />
    </Suspense>
  )
}
