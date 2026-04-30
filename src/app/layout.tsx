import type { Metadata } from "next"
import "./globals.css"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import { Breadcrumbs } from "@/components/layout/Breadcrumbs"
import { Toaster } from "@/components/ui/toaster"

export const metadata: Metadata = {
  title: {
    default: "Otiva — маркетплейс",
    template: "%s | Otiva",
  },
  description: "Otiva — современная доска объявлений для покупки и продажи товаров, авто, недвижимости и услуг",
  keywords: ["объявления", "купить", "продать", "маркетплейс", "Otiva"],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <body>
        <div className="flex min-h-screen flex-col bg-white text-zinc-950">
          <Header />
          <main className="flex-1 pb-16 lg:pb-0">
            <Breadcrumbs />
            {children}
          </main>
          <div className="hidden lg:block"><Footer /></div>
        </div>
        <Toaster />
      </body>
    </html>
  )
}
