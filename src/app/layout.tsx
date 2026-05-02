import type { Metadata } from "next"
import "./globals.css"
import { SiteShell } from "@/components/layout/SiteShell"
import { Toaster } from "@/components/ui/toaster"

export const metadata: Metadata = {
  title: {
    default: "Нашло — купить и продать в России",
    template: "%s | Нашло",
  },
  description: "Нашло — бесплатная доска объявлений. Покупайте и продавайте товары, авто, недвижимость, электронику и одежду. Быстро, удобно, безопасно.",
  keywords: [
    "доска объявлений",
    "купить",
    "продать",
    "объявления",
    "бесплатные объявления",
    "маркетплейс",
    "авто объявления",
    "недвижимость объявления",
    "купить телефон",
    "продать вещи",
    "Нашло",
    "nashlo",
  ],
  metadataBase: new URL("https://nashlo.ru"),
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: "https://nashlo.ru",
    siteName: "Нашло",
    title: "Нашло — купить и продать в России",
    description: "Бесплатная доска объявлений. Авто, недвижимость, электроника, одежда и многое другое.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Нашло — маркетплейс объявлений",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Нашло — купить и продать в России",
    description: "Бесплатная доска объявлений. Авто, недвижимость, электроника, одежда и многое другое.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://nashlo.ru",
  },
  verification: {
    yandex: "yandex-verification-code",
  },
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
