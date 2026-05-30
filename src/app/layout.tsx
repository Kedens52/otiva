import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { SiteShell } from "@/components/layout/SiteShell"
import { Toaster } from "@/components/ui/toaster"
import { getPublicSiteOrigin } from "@/lib/seo/site"

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: {
    default: "Нашло — объявления и заявки «Куплю» в России",
    template: "%s | Нашло",
  },
  description:
    "Нашло — маркетплейс объявлений: ищите товары и услуги или размещайте заявку «Куплю» — продавцы сами предложат варианты. Авто, недвижимость, электроника, одежда по всей России.",
  keywords: [
    "доска объявлений",
    "купить",
    "продать",
    "объявления",
    "заявка куплю",
    "куплю",
    "бесплатные объявления",
    "маркетплейс",
    "авто объявления",
    "недвижимость объявления",
    "купить телефон",
    "продать вещи",
    "Нашло",
    "nashlo",
    "kyplu",
  ],
  metadataBase: new URL(getPublicSiteOrigin()),
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: "https://nashlo.ru",
    siteName: "Нашло",
    title: "Нашло — объявления и заявки «Куплю»",
    description:
      "Ищите объявления или оставьте заявку «Куплю» — продавцы предложат подходящие варианты. Авто, недвижимость, техника, услуги.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Нашло — объявления и заявки «Куплю»",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Нашло — объявления и заявки «Куплю»",
    description:
      "Ищите объявления или оставьте заявку «Куплю» — продавцы предложат подходящие варианты. Авто, недвижимость, техника, услуги.",
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
  verification: {
    yandex: "6eb4b0158e7865c6",
  },
  icons: {
    icon: [{ url: "/nashlo-logo-mark.png", type: "image/png" }],
    apple: [{ url: "/nashlo-logo-mark.png", type: "image/png" }],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru" className={inter.variable}>
      <body>
        <SiteShell>{children}</SiteShell>
        <Toaster />
      </body>
    </html>
  )
}
