import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET(
  _request: NextRequest,
  { params }: { params: { slug: string } },
) {
  const listing = await prisma.businessListing.findFirst({
    where: {
      OR: [{ id: params.slug }, { slug: params.slug }],
      status: "ACTIVE",
      company: { verificationStatus: "VERIFIED", isBlocked: false },
    },
    include: {
      company: {
        select: {
          id: true,
          name: true,
          city: true,
          region: true,
          publicSlug: true,
          verificationStatus: true,
          industry: true,
        },
      },
    },
  })

  if (!listing) {
    return NextResponse.json({ error: "Не найдено" }, { status: 404 })
  }

  await prisma.businessListing.update({
    where: { id: listing.id },
    data: { views: { increment: 1 } },
  }).catch(() => {})

  return NextResponse.json({ listing })
}
