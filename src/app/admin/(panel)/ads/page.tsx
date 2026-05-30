"use client"

import { AdminAdCampaignsPanel } from "@/components/admin/AdminAdCampaignsPanel"
import { AdminAdsModerationPanel } from "@/components/admin/AdminAdsModerationPanel"
import { AdminAdsPlacementGuide } from "@/components/admin/AdminAdsPlacementGuide"
import { AdminAdsSectionNav } from "@/components/admin/AdminAdsSectionNav"
import { AdminAdPlacementsPanel } from "@/components/admin/AdminAdPlacementsPanel"
import { AdminBannerSlotsPanel } from "@/components/admin/AdminBannerSlotsPanel"
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader"
import { AdminPageShell } from "@/components/admin/layout/AdminPageShell"

export default function AdminAdsPage() {
  return (
    <AdminPageShell className="py-8">
      <AdminPageHeader
        title="Реклама на сайте"
        description="Всё в одном месте: полоса над шапкой, баннеры на главной, реклама между объявлениями в лентах и очередь модерации."
      />

      <AdminAdsSectionNav />

      <div className="mt-6">
        <AdminAdPlacementsPanel />
      </div>

      <div id="map" className="scroll-mt-24">
        <AdminAdsPlacementGuide />
      </div>

      <div className="mt-10 space-y-16">
        <AdminBannerSlotsPanel />
        <AdminAdCampaignsPanel />
        <AdminAdsModerationPanel />
      </div>
    </AdminPageShell>
  )
}
