"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { BadgeCheck } from "lucide-react"
import { ListingPriceBlock } from "@/components/business/public/ListingPriceBlock"
import { BusinessInquiryModal } from "@/components/business/inquiry/BusinessInquiryModal"
import { BusinessReportModal } from "@/components/business/inquiry/BusinessReportModal"
import { BusinessContactModal } from "@/components/business/messages/BusinessContactModal"
import { companyPublicPath } from "@/lib/business/get-public-company"

type Props = {
  listing: {
    id: string
    slug: string | null
    title: string
    description: string
    price: number
    priceFrom: number | null
    priceTo: number | null
    priceType: string
    priceUnit: string | null
    currency: string
    wholesaleTiers: unknown
    minOrderQuantity: number | null
    availabilityStatus: string | null
    productionTime: string | null
    deliveryTime: string | null
    deliveryRegions: string[]
    paymentTerms: string | null
    vatType: string | null
    city: string | null
    images: string[]
    company: {
      id: string
      name: string
      publicSlug: string | null
      verificationStatus: string
    }
  }
}

export function BusinessListingDetailView({ listing }: Props) {
  const [inquiryOpen, setInquiryOpen] = useState(false)
  const [contactOpen, setContactOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [inquiryType, setInquiryType] = useState<"PRICE_REQUEST" | "COMMERCIAL_OFFER">("PRICE_REQUEST")
  const companyPath = companyPublicPath(listing.company)

  return (
    <>
      <article className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div>
          {listing.images[0] && (
            <div className="relative mb-4 aspect-[16/10] overflow-hidden rounded-2xl bg-zinc-100">
              <Image src={listing.images[0]} alt="" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 800px" priority />
            </div>
          )}
          <ListingPriceBlock
            price={listing.price}
            priceFrom={listing.priceFrom}
            priceTo={listing.priceTo}
            priceType={listing.priceType}
            priceUnit={listing.priceUnit}
            currency={listing.currency}
            wholesaleTiers={listing.wholesaleTiers}
            minOrderQuantity={listing.minOrderQuantity}
          />
          <h1 className="mt-4 text-2xl font-bold text-zinc-950">{listing.title}</h1>
          {listing.city && <p className="mt-1 text-sm text-zinc-500">{listing.city}</p>}
          <div className="mt-4 grid gap-2 text-sm text-zinc-600 sm:grid-cols-2">
            {listing.availabilityStatus && <p>Наличие: {listing.availabilityStatus}</p>}
            {listing.productionTime && <p>Производство: {listing.productionTime}</p>}
            {listing.deliveryTime && <p>Доставка: {listing.deliveryTime}</p>}
            {listing.vatType && <p>НДС: {listing.vatType}</p>}
            {listing.paymentTerms && <p>Оплата: {listing.paymentTerms}</p>}
            {listing.deliveryRegions.length > 0 && (
              <p className="sm:col-span-2">Регионы: {listing.deliveryRegions.join(", ")}</p>
            )}
          </div>
          <div className="prose prose-sm mt-6 max-w-none whitespace-pre-wrap text-zinc-700">{listing.description}</div>
        </div>
        <aside className="space-y-3">
          <Link href={companyPath} className="block rounded-2xl border border-zinc-200 bg-white p-4">
            <p className="text-xs text-zinc-500">Компания</p>
            <p className="mt-1 flex items-center gap-2 font-semibold text-zinc-950">
              {listing.company.verificationStatus === "VERIFIED" && (
                <BadgeCheck className="h-4 w-4 text-emerald-600" />
              )}
              {listing.company.name}
            </p>
          </Link>
          <button
            type="button"
            onClick={() => {
              setInquiryType("PRICE_REQUEST")
              setInquiryOpen(true)
            }}
            className="w-full rounded-xl bg-[hsl(var(--nashlo-orange))] py-3 text-sm font-semibold text-white"
          >
            Запросить прайс
          </button>
          <button
            type="button"
            onClick={() => {
              setInquiryType("COMMERCIAL_OFFER")
              setInquiryOpen(true)
            }}
            className="w-full rounded-xl border border-zinc-200 py-3 text-sm font-semibold text-zinc-800"
          >
            Запросить КП
          </button>
          <button
            type="button"
            onClick={() => setContactOpen(true)}
            className="block w-full rounded-xl border border-zinc-200 py-3 text-center text-sm font-semibold text-zinc-800"
          >
            Написать
          </button>
          <button
            type="button"
            onClick={() => setReportOpen(true)}
            className="w-full text-center text-xs text-zinc-500 underline"
          >
            Пожаловаться
          </button>
        </aside>
      </article>
      <BusinessContactModal
        open={contactOpen}
        onClose={() => setContactOpen(false)}
        companyId={listing.company.id}
        companyName={listing.company.name}
        businessListingId={listing.id}
        listingTitle={listing.title}
      />
      <BusinessInquiryModal
        open={inquiryOpen}
        onClose={() => setInquiryOpen(false)}
        companyId={listing.company.id}
        companyName={listing.company.name}
        listingId={listing.id}
        listingTitle={listing.title}
        type={inquiryType}
      />
      <BusinessReportModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        companyId={listing.company.id}
        companyName={listing.company.name}
        businessListingId={listing.id}
      />
    </>
  )
}
