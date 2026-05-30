import type { Metadata } from "next"
import { buildNoindexMetadata } from "@/lib/seo/site"
import { ProfileProtectedLayout } from "@/components/profile/ProfileProtectedLayout"

export const metadata: Metadata = buildNoindexMetadata({
  title: "Чат | Нашло",
  description: "Личный чат пользователей платформы Нашло.",
  path: "/chat",
})

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return <ProfileProtectedLayout>{children}</ProfileProtectedLayout>
}
