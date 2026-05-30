import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { requireCompanyAccess, canManageListings } from "@/lib/business/access"
import { canCreateBusinessListing } from "@/lib/business/guards"
import { createListingSlug } from "@/lib/seo/slug"

export const dynamic = "force-dynamic"

const createSchema = z.object({
  companyId: z.string().min(1),
  type: z.enum([
    "WHOLESALE_OFFER", "SUPPLY", "BUSINESS_FOR_SALE", "FRANCHISE", "EQUIPMENT",
    "COMMERCIAL_REAL_ESTATE", "SERVICE_FOR_BUSINESS", "PROCUREMENT_REQUEST",
    "PARTNERSHIP", "INVESTMENT",
  ]),
  category: z.string().min(1).max(80),
  subcategory: z.string().max(80).optional(),
  title: z.string().min(5).max(120),
  description: z.string().min(20).max(8000),
  price: z.number().min(0).max(10_000_000_000),
  priceType: z.string().max(40).optional(),
  minOrderQuantity: z.number().int().min(0).optional(),
  wholesalePrice: z.number().min(0).optional(),
  city: z.string().max(100).optional(),
  region: z.string().max(100).optional(),
  deliveryRegions: z.array(z.string()).max(20).optional(),
  images: z.array(z.string()).max(15).optional(),
  attributes: z.record(z.unknown()).optional(),
})

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams
  const type = sp.get("type") ?? undefined
  const category = sp.get("category") ?? undefined
  const city = sp.get("city") ?? undefined
  const companyId = sp.get("companyId") ?? undefined
  const page = Math.max(1, Number.parseInt(sp.get("page") ?? "1", 10) || 1)
  const pageSize = Math.min(48, Number.parseInt(sp.get("pageSize") ?? "24", 10) || 24)

  const where = {
    status: "ACTIVE" as const,
    ...(type ? { type: type as never } : {}),
    ...(category ? { category } : {}),
    ...(city ? { city: { equals: city, mode: "insensitive" as const } } : {}),
    ...(companyId ? { companyId } : {}),
    company: { verificationStatus: "VERIFIED" as const, isBlocked: false },
  }

  const [items, total] = await Promise.all([
    prisma.businessListing.findMany({
      where,
      include: {
        company: {
          select: {
            id: true,
            name: true,
            city: true,
            verificationStatus: true,
            publicSlug: true,
          },
        },
      },
      orderBy: [{ isPromoted: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.businessListing.count({ where }),
  ])

  return NextResponse.json({ items, total, page, pageSize })
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 })
  }

  try {
    const data = createSchema.parse(await request.json())
    const access = await requireCompanyAccess(user.id, data.companyId, [
      "OWNER", "ADMIN", "MANAGER",
    ])
    if (!access || !canManageListings(access.role)) {
      return NextResponse.json({ error: "Нет доступа к компании" }, { status: 403 })
    }

    const company = await prisma.company.findUnique({ where: { id: data.companyId } })
    if (!company || company.isBlocked) {
      return NextResponse.json({ error: "Компания недоступна" }, { status: 403 })
    }

    const listingGate = await canCreateBusinessListing(company.id, company.verificationStatus)
    if (!listingGate.ok) {
      return NextResponse.json({ error: listingGate.error }, { status: 403 })
    }

    const listing = await prisma.businessListing.create({
      data: {
        companyId: data.companyId,
        ownerId: user.id,
        type: data.type,
        category: data.category,
        subcategory: data.subcategory,
        title: data.title.trim(),
        description: data.description.trim(),
        price: data.price,
        priceType: data.priceType ?? "FIXED",
        minOrderQuantity: data.minOrderQuantity,
        wholesalePrice: data.wholesalePrice,
        city: data.city ?? company.city,
        region: data.region ?? company.region,
        deliveryRegions: data.deliveryRegions ?? [],
        images: data.images ?? [],
        attributes: data.attributes,
        status: "PENDING",
      },
      include: {
        company: { select: { id: true, name: true, verificationStatus: true } },
      },
    })

    const slug = createListingSlug(data.title, listing.city ?? company.city, listing.id)
    const withSlug = await prisma.businessListing.update({
      where: { id: listing.id },
      data: { slug },
      include: {
        company: { select: { id: true, name: true, verificationStatus: true } },
      },
    })

    return NextResponse.json({ listing: withSlug }, { status: 201 })
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors[0]?.message ?? "Неверные данные" }, { status: 400 })
    }
    console.error("business listings POST:", e)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}
