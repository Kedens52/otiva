import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const now = new Date()
    const banner = await prisma.siteBanner.findFirst({
      where: {
        active: true,
        OR: [
          { startsAt: null },
          { startsAt: { lte: now } },
        ],
        AND: [
          {
            OR: [
              { endsAt: null },
              { endsAt: { gte: now } },
            ],
          },
        ],
      },
      orderBy: { updatedAt: "desc" },
    })

    return NextResponse.json({ banner })
  } catch (error) {
    console.warn("site-banner GET unavailable:", error)
    return NextResponse.json({ banner: null })
  }
}
