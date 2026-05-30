import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sanitizeAdTargetUrl } from "@/lib/ads/url-safety"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const adId = url.searchParams.get("adId")
  const rawTo = url.searchParams.get("to")

  if (adId) {
    await prisma.adEvent
      .create({
        data: {
          adId,
          eventType: "CLICK",
          sessionId: null,
        },
      })
      .catch(() => {})
    await prisma.adCampaign
      .update({ where: { id: adId }, data: { clicks: { increment: 1 } } })
      .catch(() => {})
  }

  const safe = rawTo ? sanitizeAdTargetUrl(rawTo) : null
  const target = safe?.ok ? safe.url : "/advertising"

  if (target.startsWith("/")) {
    return NextResponse.redirect(new URL(target, request.url))
  }

  return NextResponse.redirect(target)
}
