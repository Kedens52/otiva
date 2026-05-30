"use client"

import { usePathname } from "next/navigation"
import { isPublicSellerProfilePath } from "@/lib/cabinet-routes"
import { ProfileProtectedLayout } from "@/components/profile/ProfileProtectedLayout"

export function ProfileLayoutRouter({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  if (isPublicSellerProfilePath(pathname)) {
    return <>{children}</>
  }

  return <ProfileProtectedLayout>{children}</ProfileProtectedLayout>
}
