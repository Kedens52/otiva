import type {
  AdMediaType,
  BannerSlotAd,
  BannerSlotAdStatus,
  BannerSlotId as PrismaSlotId,
} from "@prisma/client"
import { inferBannerMediaType } from "@/lib/ads/banner-slot-media"
import { normalizeAdDisclosureMark } from "@/lib/ads/disclosure-mark"
import type { AdSlotId, AdStatus, ManagedAd } from "@/lib/ad-store"

const SLOT_IDS: AdSlotId[] = [
  "leaderboard",
  "mobileLeaderboard",
  "sidebarTop",
  "sidebarTall",
  "listingSidebar",
]

export function isAdSlotId(value: string): value is AdSlotId {
  return SLOT_IDS.includes(value as AdSlotId)
}

function toDateString(value: Date): string {
  return value.toISOString().slice(0, 10)
}

function parseDateInput(value: string): Date {
  const date = new Date(`${value}T12:00:00.000Z`)
  if (Number.isNaN(date.getTime())) {
    throw new Error("Некорректная дата")
  }
  return date
}

export function serializeBannerSlotAd(row: BannerSlotAd): ManagedAd {
  return {
    id: row.id,
    slot: row.slot as AdSlotId,
    title: row.title,
    subtitle: row.subtitle,
    cta: row.cta,
    href: row.href,
    image: row.image ?? undefined,
    mediaType: row.mediaType ?? inferBannerMediaType(row.image),
    mediaMimeType: row.mediaMimeType ?? undefined,
    mediaWidth: row.mediaWidth ?? undefined,
    mediaHeight: row.mediaHeight ?? undefined,
    mediaDuration: row.mediaDuration ?? undefined,
    advertiser: row.advertiser,
    active: row.active,
    startsAt: toDateString(row.startsAt),
    endsAt: toDateString(row.endsAt),
    erid: row.erid,
    ordName: row.ordName,
    ownerEmail: row.ownerEmail ?? undefined,
    ownerName: row.ownerName ?? undefined,
    status: row.status as AdStatus,
    moderationComment: row.moderationComment ?? undefined,
    impressions: row.impressions,
    clicks: row.clicks,
    lastImpressionAt: row.lastImpressionAt?.toISOString(),
    lastClickAt: row.lastClickAt?.toISOString(),
    disclosureMark: normalizeAdDisclosureMark(row.disclosureMark),
  }
}

export function normalizeManagedAdForSave(ad: ManagedAd): ManagedAd {
  const hasImage = Boolean(ad.image?.trim())
  const imageOnly = Boolean(ad.imageOnly && hasImage)
  const title = ad.title?.trim() || (hasImage ? "Реклама" : "")

  return {
    ...ad,
    title,
    subtitle: imageOnly ? title : ad.subtitle?.trim() || title,
    cta: ad.cta?.trim() || "Подробнее",
    href: ad.href?.trim() || "/advertising",
    advertiser: ad.advertiser?.trim() || "Реклама",
    erid: ad.erid?.trim() || "—",
    ordName: ad.ordName?.trim() || "—",
    imageOnly,
    disclosureMark: normalizeAdDisclosureMark(ad.disclosureMark),
  }
}

export function managedAdToDbInput(ad: ManagedAd) {
  const normalized = normalizeManagedAdForSave(ad)
  return {
    slot: normalized.slot as PrismaSlotId,
    title: normalized.title,
    subtitle: normalized.subtitle,
    cta: normalized.cta,
    href: normalized.href,
    image: normalized.image?.trim() || null,
    mediaType: (normalized.mediaType ?? inferBannerMediaType(normalized.image)) as AdMediaType,
    mediaMimeType: normalized.mediaMimeType?.trim() || null,
    mediaWidth: normalized.mediaWidth ?? null,
    mediaHeight: normalized.mediaHeight ?? null,
    mediaDuration: normalized.mediaDuration ?? null,
    advertiser: normalized.advertiser,
    disclosureMark: normalized.disclosureMark,
    active: normalized.active,
    startsAt: parseDateInput(normalized.startsAt),
    endsAt: parseDateInput(normalized.endsAt),
    erid: normalized.erid,
    ordName: normalized.ordName,
    ownerEmail: normalized.ownerEmail?.trim() || null,
    ownerName: normalized.ownerName?.trim() || null,
    status: (normalized.status || (normalized.active ? "approved" : "draft")) as BannerSlotAdStatus,
    moderationComment: normalized.moderationComment?.trim() || null,
    impressions: normalized.impressions ?? 0,
    clicks: normalized.clicks ?? 0,
    lastImpressionAt: normalized.lastImpressionAt ? new Date(normalized.lastImpressionAt) : null,
    lastClickAt: normalized.lastClickAt ? new Date(normalized.lastClickAt) : null,
  }
}

export function pickActiveAds(ads: ManagedAd[], now = new Date().toISOString().slice(0, 10)) {
  const result: Partial<Record<AdSlotId, ManagedAd>> = {}

  for (const slot of SLOT_IDS) {
    const active = ads.find(
      (ad) =>
        ad.slot === slot &&
        ad.active &&
        ad.status === "approved" &&
        ad.startsAt <= now &&
        ad.endsAt >= now,
    )
    if (active) result[slot] = active
  }

  return result
}
