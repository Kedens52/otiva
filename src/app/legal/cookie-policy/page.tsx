import type { Metadata } from "next"
import { CookiePolicyDocument } from "@/components/legal/CookiePolicyDocument"
import { buildPageMetadata } from "@/lib/seo/site"

export const metadata: Metadata = buildPageMetadata({
  title: "Политика использования файлов cookie — Нашло",
  description: "Политика использования файлов cookie на сайте Nashlo / Нашло.",
  path: "/legal/cookie-policy",
  canonicalPath: "/legal/cookie-policy",
})

export default function CookiePolicyPage() {
  return <CookiePolicyDocument />
}
