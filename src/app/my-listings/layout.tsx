import type { Metadata } from "next"
import { buildNoindexMetadata } from "@/lib/seo/site"
import { ProfileProtectedLayout } from "@/components/profile/ProfileProtectedLayout"

export const metadata: Metadata = buildNoindexMetadata({
  title: "Мои объявления | Нашло",
  description: "Личный раздел управления объявлениями на Нашло.",
  path: "/my-listings",
})

export default function MyListingsLayout({ children }: { children: React.ReactNode }) {
  return <ProfileProtectedLayout>{children}</ProfileProtectedLayout>
}
