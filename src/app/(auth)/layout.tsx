import type { Metadata } from "next"
import { buildNoindexMetadata } from "@/lib/seo/site"

export const metadata: Metadata = buildNoindexMetadata({
  title: "Авторизация | Нашло",
  description: "Вход и регистрация в личном кабинете Нашло.",
  path: "/login",
})

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children
}
