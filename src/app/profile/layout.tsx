import type { Metadata } from "next"
import { ProfileLayoutRouter } from "@/components/profile/ProfileLayoutRouter"
import { buildNoindexMetadata } from "@/lib/seo/site"

export const metadata: Metadata = buildNoindexMetadata({
  title: "Профиль | Нашло",
  description: "Личный кабинет пользователя на Нашло.",
  path: "/profile",
})

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return <ProfileLayoutRouter>{children}</ProfileLayoutRouter>
}
