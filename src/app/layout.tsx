import type { Metadata } from "next"
import "./globals.css"
import { SiteShell } from "@/components/layout/SiteShell"
import { Toaster } from "@/components/ui/toaster"

export const metadata: Metadata = {
  title: {
    default: "Нашло — маркетплейс",
    template: "%s | Нашло",
  },
  description: "Нашло — современная доска объявлений для покупки и продажи товаров, авто, недвижимости и услуг",
  keywords: ["объявления", "купить", "продать", "маркетплейс", "Нашло"],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <body>
        <SiteShell>{children}</SiteShell>
        <Toaster />
      </body>
    </html>
  )
}
