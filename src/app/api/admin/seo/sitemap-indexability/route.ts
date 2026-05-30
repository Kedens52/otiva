import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAdminApi } from "@/lib/admin/guards"
import {
  isListingIndexable,
  listingIndexBlockReason,
  listingIndexBlockReasonLabel,
} from "@/lib/seo/listing-indexability"
import { getListingPublicPath } from "@/lib/seo/paths"

export const dynamic = "force-dynamic"

type Filter = "all" | "indexable" | "blocked"

function parseFilter(raw: string | null): Filter {
  if (raw === "indexable" || raw === "blocked") return raw
  return "all"
}

export const GET = withAdminApi(async ({ req }) => {
  try {
    const { searchParams } = req.nextUrl
    const page = Math.max(1, Number.parseInt(searchParams.get("page") || "1", 10))
    const take = Math.min(100, Math.max(10, Number.parseInt(searchParams.get("take") || "50", 10)))
    const filter = parseFilter(searchParams.get("filter"))
    const reasonFilter = searchParams.get("reason")?.trim() || ""
    const search = searchParams.get("search")?.trim() || ""
    const statusFilter = searchParams.get("status")?.trim() || ""

    const listings = await prisma.listing.findMany({
      where: {
        ...(statusFilter ? { status: statusFilter as never } : {}),
        ...(search
          ? {
              OR: [
                { title: { contains: search, mode: "insensitive" } },
                { id: { contains: search, mode: "insensitive" } },
                { city: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        slug: true,
        title: true,
        status: true,
        city: true,
        description: true,
        attributes: true,
        categoryId: true,
        category: { select: { slug: true, nameRu: true } },
        updatedAt: true,
      },
      orderBy: { updatedAt: "desc" },
    })

    const enriched = listings.map((listing) => {
      const input = {
        status: listing.status,
        title: listing.title,
        categoryId: listing.categoryId,
        categorySlug: listing.category.slug,
        city: listing.city,
        description: listing.description,
        attributes: listing.attributes as Record<string, unknown> | null,
      }
      const indexable = isListingIndexable(input)
      const reason = listingIndexBlockReason(input)
      return {
        id: listing.id,
        title: listing.title,
        status: listing.status,
        city: listing.city,
        categorySlug: listing.category.slug,
        categoryName: listing.category.nameRu,
        updatedAt: listing.updatedAt.toISOString(),
        indexable,
        reason,
        reasonLabel: listingIndexBlockReasonLabel(reason),
        publicPath: getListingPublicPath({
          id: listing.id,
          slug: listing.slug,
          title: listing.title,
          city: listing.city,
        }),
      }
    })

    const summary = {
      total: enriched.length,
      indexable: enriched.filter((r) => r.indexable).length,
      blocked: enriched.filter((r) => !r.indexable).length,
      byReason: Object.entries(
        enriched.reduce<Record<string, number>>((acc, row) => {
          if (row.indexable) return acc
          const key = row.reason ?? "unknown"
          acc[key] = (acc[key] ?? 0) + 1
          return acc
        }, {}),
      )
        .map(([reason, count]) => ({
          reason,
          count,
          label: listingIndexBlockReasonLabel(reason),
        }))
        .sort((a, b) => b.count - a.count),
    }

    let filtered = enriched
    if (filter === "indexable") filtered = enriched.filter((r) => r.indexable)
    if (filter === "blocked") filtered = enriched.filter((r) => !r.indexable)
    if (reasonFilter) filtered = filtered.filter((r) => r.reason === reasonFilter)

    const total = filtered.length
    const items = filtered.slice((page - 1) * take, page * take)

    return NextResponse.json({
      ok: true,
      summary,
      items,
      page,
      take,
      total,
      totalPages: Math.max(1, Math.ceil(total / take)),
    })
  } catch (error) {
    console.error("admin seo sitemap-indexability GET error:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}, "listings.view")
