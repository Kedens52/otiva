import type { Metadata } from "next"
import { buildBusinessPrivateMetadata } from "@/lib/business/seo"

export const metadata: Metadata = buildBusinessPrivateMetadata("Вход для бизнеса")

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
