"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import {
  BadgeCheck,
  Building2,
  FileText,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Shield,
} from "lucide-react"
import type { BusinessListing, BusinessCatalogCategory, Company } from "@prisma/client"
import { formatBusinessPrice } from "@/lib/business/pricing"
import { BUSINESS_ROLE_OPTIONS } from "@/lib/business/config"
import { BusinessInquiryModal } from "@/components/business/inquiry/BusinessInquiryModal"
import { BusinessReportModal } from "@/components/business/inquiry/BusinessReportModal"
import { BusinessContactModal } from "@/components/business/messages/BusinessContactModal"
import { CompanyReviewSection } from "@/components/business/public/CompanyReviewSection"

type ListingRow = BusinessListing & {
  catalogCategory: { id: string; title: string; slug: string } | null
}

type PublicDoc = { id: string; title: string; fileUrl: string; docType: string }

type ReviewRow = {
  id: string
  rating: number
  comment: string
  createdAt: string | Date
  authorName: string
  authorAvatar: string | null
}

type Props = {
  company: Company & {
    catalogCategories: BusinessCatalogCategory[]
    listings: ListingRow[]
    documents: PublicDoc[]
    _count: { listings: number; inquiriesReceived: number }
  }
  profileCompleteness: number
  reviews: ReviewRow[]
  reviewAverage: number
  reviewCount: number
}

const TABS = ["Каталог", "О компании", "Условия", "Документы", "Отзывы", "Контакты"] as const

const ROLE_LABEL = Object.fromEntries(BUSINESS_ROLE_OPTIONS.map((o) => [o.value, o.label]))

export function CompanyPublicPage({
  company,
  profileCompleteness,
  reviews,
  reviewAverage,
  reviewCount,
}: Props) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Каталог")
  const [inquiryOpen, setInquiryOpen] = useState(false)
  const [contactOpen, setContactOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [inquiryType, setInquiryType] = useState<"PRICE_REQUEST" | "COMMERCIAL_OFFER">("PRICE_REQUEST")

  const roleLabel = ROLE_LABEL[company.businessRole] ?? company.businessRole

  const grouped = company.catalogCategories.length
    ? company.catalogCategories.map((cat) => ({
        cat,
        items: company.listings.filter((l) => l.catalogCategoryId === cat.id),
      }))
    : [{ cat: null, items: company.listings }]

  function openInquiry(type: "PRICE_REQUEST" | "COMMERCIAL_OFFER") {
    setInquiryType(type)
    setInquiryOpen(true)
  }

  return (
    <>
      <div className="pb-[calc(env(safe-area-inset-bottom)+5.75rem)] lg:pb-0">
        <div className="overflow-hidden rounded-[24px] border border-zinc-200 bg-white shadow-sm">
          <div className="relative h-36 bg-gradient-to-br from-zinc-100 via-orange-50/80 to-zinc-50 sm:h-48">
            {company.coverUrl ? (
              <Image src={company.coverUrl} alt="" fill className="object-cover" priority sizes="(max-width: 768px) 100vw, 1200px" />
            ) : (
              <div className="flex h-full items-center justify-center text-sm font-medium text-zinc-400">
                Нашло Бизнес
              </div>
            )}
          </div>
          <div className="relative px-4 pb-5 sm:px-6">
            <div className="-mt-10 flex flex-col gap-4 sm:-mt-12 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-end gap-4">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-4 border-white bg-white shadow-md sm:h-24 sm:w-24">
                  {company.logoUrl ? (
                    <Image src={company.logoUrl} alt="" fill className="object-cover" sizes="96px" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-zinc-100">
                      <Building2 className="h-8 w-8 text-zinc-400" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 pb-1">
                  <h1 className="text-xl font-bold text-zinc-950 sm:text-2xl">{company.name}</h1>
                  {company.legalName && company.legalName !== company.name && (
                    <p className="text-sm text-zinc-500">{company.legalName}</p>
                  )}
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-zinc-600">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                      <BadgeCheck className="h-3.5 w-3.5" /> Проверенная компания
                    </span>
                    {company.industry && <span>{company.industry}</span>}
                    {[company.city, company.region].filter(Boolean).length > 0 && (
                      <span className="inline-flex items-center gap-0.5">
                        <MapPin className="h-3.5 w-3.5" />
                        {[company.city, company.region].filter(Boolean).join(", ")}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-zinc-500">{roleLabel}</p>
                </div>
              </div>
              <div className="hidden flex-wrap gap-2 sm:flex">
                <button
                  type="button"
                  onClick={() => openInquiry("PRICE_REQUEST")}
                  className="rounded-xl bg-[hsl(var(--nashlo-orange))] px-4 py-2.5 text-sm font-semibold text-white"
                >
                  Запросить прайс
                </button>
                <button
                  type="button"
                  onClick={() => setContactOpen(true)}
                  className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-800"
                >
                  Написать
                </button>
              </div>
            </div>
            {company.shortDescription && (
              <p className="mt-4 text-sm text-zinc-700 sm:text-base">{company.shortDescription}</p>
            )}
          </div>
        </div>

        <section className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-900">
            <Shield className="h-4 w-4" />
            Доверие
          </div>
          <ul className="mt-2 grid gap-1 text-sm text-emerald-900/90 sm:grid-cols-2">
            <li>· Компания проверена модерацией</li>
            <li>· ИНН указан в профиле</li>
            <li>· {company._count.listings} активных предложений</li>
            {reviewCount > 0 && <li>· {reviewAverage.toFixed(1)} · {reviewCount} отзывов</li>}
            <li>· На Нашло Бизнес с {new Date(company.createdAt).getFullYear()}</li>
          </ul>
          <button
            type="button"
            onClick={() => setReportOpen(true)}
            className="mt-3 text-xs font-semibold text-zinc-600 underline"
          >
            Пожаловаться на компанию
          </button>
        </section>

        <div className="mt-4 flex snap-x snap-mandatory gap-1 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`shrink-0 snap-start rounded-full px-4 py-2 text-sm font-semibold ${
                tab === t ? "bg-zinc-950 text-white" : "bg-white text-zinc-600 ring-1 ring-zinc-200"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_280px]">
          <div className="min-w-0">
            {tab === "Каталог" && (
              <div className="space-y-8">
                {grouped.map(({ cat, items }) =>
                  items.length === 0 ? null : (
                    <div key={cat?.id ?? "all"}>
                      {cat && <h2 className="text-lg font-semibold text-zinc-950">{cat.title}</h2>}
                      <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                        {items.map((l) => (
                          <li key={l.id} className="rounded-2xl border border-zinc-200 bg-white p-4">
                            {l.images[0] && (
                              <div className="relative mb-3 aspect-[4/3] overflow-hidden rounded-xl bg-zinc-100">
                                <Image src={l.images[0]} alt="" fill className="object-cover" sizes="300px" />
                              </div>
                            )}
                            <Link href={`/business/listings/${l.slug ?? l.id}`} className="font-semibold text-zinc-950 hover:underline">
                              {l.title}
                            </Link>
                            <p className="mt-1 text-sm font-medium text-[hsl(var(--nashlo-orange))]">
                              {formatBusinessPrice({
                                price: l.price,
                                priceFrom: l.priceFrom,
                                priceTo: l.priceTo,
                                priceType: l.priceType,
                                priceUnit: l.priceUnit,
                                currency: l.currency,
                              })}
                            </p>
                            {l.minOrderQuantity && (
                              <p className="text-xs text-zinc-500">Мин. заказ: {l.minOrderQuantity}</p>
                            )}
                            {l.availabilityStatus && (
                              <p className="text-xs text-zinc-500">{l.availabilityStatus}</p>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ),
                )}
              </div>
            )}

          {tab === "О компании" && (
            <div className="rounded-2xl border border-zinc-200 bg-white p-5">
              {company.description ? (
                <p className="whitespace-pre-wrap text-sm text-zinc-700">{company.description}</p>
              ) : (
                <p className="text-sm text-zinc-500">Описание скоро появится.</p>
              )}
            </div>
          )}

          {tab === "Условия" && (
            <div className="grid gap-3 sm:grid-cols-2">
              {company.minOrderInfo && (
                <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase text-zinc-400">Минимальный заказ</p>
                  <p className="mt-1 text-sm text-zinc-800">{company.minOrderInfo}</p>
                </div>
              )}
              {company.paymentTerms && (
                <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase text-zinc-400">Оплата</p>
                  <p className="mt-1 text-sm text-zinc-800">{company.paymentTerms}</p>
                </div>
              )}
              {company.vatType && (
                <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase text-zinc-400">НДС</p>
                  <p className="mt-1 text-sm text-zinc-800">{company.vatType}</p>
                </div>
              )}
              {company.companyDeliveryRegions.length > 0 && (
                <div className="rounded-2xl border border-zinc-200 bg-white p-4 sm:col-span-2">
                  <p className="text-xs font-semibold uppercase text-zinc-400">Регионы поставки</p>
                  <p className="mt-1 text-sm text-zinc-800">{company.companyDeliveryRegions.join(", ")}</p>
                </div>
              )}
            </div>
          )}

          {tab === "Документы" && (
            <div className="rounded-2xl border border-zinc-200 bg-white p-5">
              {company.documents.length === 0 ? (
                <p className="text-sm text-zinc-500">Публичные документы не размещены.</p>
              ) : (
                <ul className="space-y-2">
                  {company.documents.map((d) => (
                    <li key={d.id}>
                      <a
                        href={d.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-semibold text-[hsl(var(--nashlo-orange))] hover:underline"
                      >
                        {d.title}
                      </a>
                      <span className="ml-2 text-xs text-zinc-400">{d.docType}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {tab === "Отзывы" && (
            <CompanyReviewSection
              companyId={company.id}
              reviews={reviews}
              averageRating={reviewAverage}
              reviewCount={reviewCount}
            />
          )}

          {tab === "Контакты" && (
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 space-y-3 text-sm">
              {company.contactName && (
                <p>
                  <span className="text-zinc-500">Контакт: </span>
                  {company.contactName}
                  {company.contactRole ? `, ${company.contactRole}` : ""}
                </p>
              )}
              {company.showPhonePublicly && company.contactPhone && (
                <p className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-zinc-400" />
                  <a href={`tel:${company.contactPhone}`} className="font-medium text-zinc-900">
                    {company.contactPhone}
                  </a>
                </p>
              )}
              {company.showEmailPublicly && company.contactEmail && (
                <p className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-zinc-400" />
                  <a href={`mailto:${company.contactEmail}`} className="font-medium text-zinc-900">
                    {company.contactEmail}
                  </a>
                </p>
              )}
              {company.showWebsitePublicly && company.websiteUrl && (
                <a href={company.websiteUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-[hsl(var(--nashlo-orange))]">
                  Сайт компании
                </a>
              )}
              {!company.showPhonePublicly && !company.showEmailPublicly && (
                <p className="text-zinc-500">Контакты доступны через запрос прайса или сообщение.</p>
              )}
              {company.showRequisitesPublicly && company.inn && (
                <div className="mt-4 border-t border-zinc-100 pt-3 text-xs text-zinc-600">
                  <p>ИНН {company.inn}</p>
                  {company.ogrn && <p>ОГРН {company.ogrn}</p>}
                </div>
              )}
            </div>
          )}
          </div>

          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-3 rounded-2xl border border-zinc-200 bg-white p-4">
              <p className="text-xs text-zinc-500">Профиль заполнен на {profileCompleteness}%</p>
              <button
                type="button"
                onClick={() => openInquiry("PRICE_REQUEST")}
                className="w-full rounded-xl bg-[hsl(var(--nashlo-orange))] py-2.5 text-sm font-semibold text-white"
              >
                Запросить прайс
              </button>
              <button
                type="button"
                onClick={() => openInquiry("COMMERCIAL_OFFER")}
                className="w-full rounded-xl border border-zinc-200 py-2.5 text-sm font-semibold text-zinc-800"
              >
                Запросить КП
              </button>
              <button
                type="button"
                onClick={() => setContactOpen(true)}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 py-2.5 text-sm font-semibold text-zinc-800"
              >
                <MessageCircle className="h-4 w-4" /> Написать
              </button>
              <Link href={`/business/listings?companyId=${company.id}`} className="flex items-center gap-2 text-sm font-semibold text-zinc-600">
                <FileText className="h-4 w-4" /> Все предложения ({company._count.listings})
              </Link>
            </div>
          </aside>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-30 flex gap-2 border-t border-zinc-200 bg-white/95 p-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] backdrop-blur-md lg:hidden">
        <button
          type="button"
          onClick={() => openInquiry("PRICE_REQUEST")}
          className="flex-1 rounded-xl bg-[hsl(var(--nashlo-orange))] py-3 text-sm font-semibold text-white"
        >
          Запросить прайс
        </button>
        <button
          type="button"
          onClick={() => setContactOpen(true)}
          className="rounded-xl border border-zinc-200 px-4 py-3 text-sm font-semibold text-zinc-800"
        >
          Написать
        </button>
      </div>

      <BusinessContactModal
        open={contactOpen}
        onClose={() => setContactOpen(false)}
        companyId={company.id}
        companyName={company.name}
      />
      <BusinessInquiryModal
        open={inquiryOpen}
        onClose={() => setInquiryOpen(false)}
        companyId={company.id}
        companyName={company.name}
        type={inquiryType}
      />
      <BusinessReportModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        companyId={company.id}
        companyName={company.name}
      />
    </>
  )
}
