import type { Metadata } from "next"
import { buildNoindexMetadata } from "@/lib/seo/site"
import { ProfileProtectedLayout } from "@/components/profile/ProfileProtectedLayout"

export const metadata: Metadata = buildNoindexMetadata({
  title: "Сообщения | Нашло",
  description: "Личные сообщения пользователей на Нашло.",
  path: "/messages",
})

export default function MessagesLayout({ children }: { children: React.ReactNode }) {
  return <ProfileProtectedLayout>{children}</ProfileProtectedLayout>
}
