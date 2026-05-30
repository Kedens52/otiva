import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAdminApi } from "@/lib/admin/guards"
import { serializeCampaignForClient } from "@/lib/ads/campaign-service"

export const dynamic = "force-dynamic"

export const GET = withAdminApi(async () => {
  const campaigns = await prisma.adCampaign.findMany({
    where: { status: "PENDING_REVIEW" },
    include: {
      owner: { select: { id: true, name: true, phone: true, email: true } },
      changeLogs: { orderBy: { createdAt: "desc" }, take: 10 },
      payments: { where: { status: "PAID" }, orderBy: { paidAt: "desc" }, take: 1 },
    },
    orderBy: { updatedAt: "asc" },
    take: 50,
  })

  return NextResponse.json({
    campaigns: campaigns.map((c) => ({
      ...serializeCampaignForClient(c),
      owner: c.owner,
      changeLogs: c.changeLogs,
      lastPayment: c.payments[0] ?? null,
    })),
  })
}, "settings.view")
