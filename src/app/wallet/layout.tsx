import type { Metadata } from "next"
import { buildNoindexMetadata } from "@/lib/seo/site"

export const metadata: Metadata = buildNoindexMetadata({
  title: "Кошелек | Нашло",
  description: "Баланс и платежные операции пользователя на Нашло.",
  path: "/wallet",
})

export default function WalletLayout({ children }: { children: React.ReactNode }) {
  return children
}
