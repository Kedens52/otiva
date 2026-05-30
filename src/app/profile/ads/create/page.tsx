"use client"

import { CabinetPage } from "@/components/profile/CabinetPage"
import { AdCreateWizard } from "@/components/ads/cabinet/AdCreateWizard"

export default function ProfileAdsCreatePage() {
  return (
    <CabinetPage title="Создание рекламы" subtitle="Мастер из 6 шагов: формат → контент → аудитория → бюджет → оплата → модерация">
      <AdCreateWizard />
    </CabinetPage>
  )
}
