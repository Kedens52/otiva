import Link from "next/link"
import { buildBusinessRequestsMetadata } from "@/lib/business/seo"
import { BusinessBreadcrumbs } from "@/components/business/BusinessBreadcrumbs"
import { BUSINESS_BRAND } from "@/lib/business/config"

export const generateMetadata = () => buildBusinessRequestsMetadata()

export default function BusinessRequestsPage() {
  return (
    <>
      <BusinessBreadcrumbs
        items={[
          { name: "Главная", href: "/" },
          { name: BUSINESS_BRAND, href: "/business" },
          { name: "Заявки на закупку", href: "/business/requests" },
        ]}
      />
      <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center">
        <h1 className="text-2xl font-bold">Заявки на закупку</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Публичный каталог заявок появится после запуска раздела. Сейчас можно создать заявку из кабинета.
        </p>
        <Link href="/business/requests/create" className="mt-4 inline-block text-sm font-semibold text-[hsl(var(--nashlo-orange))]">
          Создать заявку
        </Link>
      </div>
    </>
  )
}
