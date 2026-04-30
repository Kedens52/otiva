import type { Metadata } from "next"
import "./globals.css"
import { SiteShell } from "@/components/layout/SiteShell"
import { Toaster } from "@/components/ui/toaster"

export const metadata: Metadata = {
  title: {
    default: "Отива — маркетплейс",
    template: "%s | Отива",
  },
  description: "Отива — современная доска объявлений для покупки и продажи товаров, авто, недвижимости и услуг",
  keywords: ["объявления", "купить", "продать", "маркетплейс", "Отива"],
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
