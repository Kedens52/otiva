import { parseListingIdFromSlug } from "@/lib/seo/slug"

const INTERNAL_LISTING_PATH = /^\/listings\/([^/?#]+)\/?$/

export type ResolvedListingReference =
  | { ok: true; listingId?: string }
  | { ok: false; error: string }

/** Принимает только внутренний путь nashlo.ru/listings/… или cuid. */
export function resolveInternalListingReference(input: {
  listingId?: string | null
  listingPath?: string | null
}): ResolvedListingReference {
  if (input.listingId?.trim()) {
    const id = input.listingId.trim()
    if (/^c[a-z0-9]{20,}$/i.test(id)) {
      return { ok: true, listingId: id }
    }
    return { ok: false, error: "Некорректный идентификатор объявления" }
  }

  const path = input.listingPath?.trim()
  if (!path) {
    return { ok: true }
  }

  if (/^https?:\/\//i.test(path) || path.includes("://")) {
    return { ok: false, error: "Допускается только ссылка на объявление на Нашло" }
  }

  const normalized = path.startsWith("/") ? path : `/${path}`
  if (!normalized.startsWith("/listings/")) {
    return { ok: false, error: "Ссылка должна вести на /listings/…" }
  }

  const match = normalized.match(INTERNAL_LISTING_PATH)
  if (!match?.[1]) {
    return { ok: false, error: "Некорректная ссылка на объявление" }
  }

  const listingId = parseListingIdFromSlug(match[1])
  if (!/^c[a-z0-9]{20,}$/i.test(listingId)) {
    return { ok: false, error: "Не удалось определить объявление по ссылке" }
  }

  return { ok: true, listingId }
}
