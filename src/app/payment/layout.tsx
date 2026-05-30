import type { Metadata } from "next"
import { buildNoindexMetadata } from "@/lib/seo/site"

export const metadata: Metadata = buildNoindexMetadata({
  title: "Статус платежа | Нашло",
  description: "Служебная страница статуса платежа на Нашло.",
  path: "/payment/success",
})

export default function PaymentLayout({ children }: { children: React.ReactNode }) {
  return children
}
