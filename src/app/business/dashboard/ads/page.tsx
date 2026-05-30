"use client"

import Link from "next/link"
import { BusinessSectionGuard } from "@/components/business/BusinessSectionGuard"

export default function BusinessDashboardAdsPage() {
  return (
    <BusinessSectionGuard section="ads">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-zinc-950">Реклама и продвижение</h1>
        <div className="rounded-2xl border border-zinc-200 bg-white p-6">
          <p className="text-sm text-zinc-600">
            B2B-продвижение и рекламные кампании — отдельно от личного раздела «Моя реклама» в
            /profile/ads.
          </p>
          <Link
            href="/legal/business-advertising"
            className="mt-4 inline-block text-sm font-semibold text-[hsl(var(--nashlo-orange))]"
          >
            Условия рекламы для бизнеса →
          </Link>
        </div>
      </div>
    </BusinessSectionGuard>
  )
}
