import type { Metadata } from "next"
import { buildNoindexMetadata } from "@/lib/seo/site"

/**
 * Корень /admin: без проверки сессии.
 * Вход — сегмент (public), панель — (panel) со своим layout и сайдбаром.
 */
export const metadata: Metadata = buildNoindexMetadata({
  title: "Админ-панель | Нашло",
  description: "Служебный раздел администрирования Нашло.",
  path: "/admin",
})

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
