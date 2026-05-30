import type { Metadata, Viewport } from "next"
import { buildNoindexMetadata } from "@/lib/seo/site"

export const metadata: Metadata = {
  ...buildNoindexMetadata({
    title: "Нашло Staff",
    description: "Десктоп-приложение для поддержки и администрирования Нашло.",
    path: "/admin/app",
  }),
  applicationName: "Нашло Staff",
  manifest: "/admin/app/manifest.json",
}

export const viewport: Viewport = {
  themeColor: "#18181b",
  width: "device-width",
  initialScale: 1,
}

export default function StaffAppRootLayout({ children }: { children: React.ReactNode }) {
  return <div className="h-screen min-h-0 overflow-hidden bg-zinc-100">{children}</div>
}
