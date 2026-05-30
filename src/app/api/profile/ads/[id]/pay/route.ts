import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { logAdCampaignChange, serializeCampaignForClient } from "@/lib/ads/campaign-service"

export const dynamic = "force-dynamic"

function campaignId(req: NextRequest) {
  const parts = req.nextUrl.pathname.split("/").filter(Boolean)
  return parts[parts.length - 2] ?? ""
}

/** MVP: внутренняя «оплата» — создаёт платёж и сразу помечает PAID → PENDING_REVIEW */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 })

  const id = campaignId(req)
  const campaign = await prisma.adCampaign.findFirst({
    where: { id, ownerId: user.id },
  })
  if (!campaign) return NextResponse.json({ error: "Не найдено" }, { status: 404 })

  if (!["DRAFT", "WAITING_PAYMENT", "NEEDS_CHANGES"].includes(campaign.status)) {
    return NextResponse.json({ error: "Оплата недоступна для этого статуса" }, { status: 409 })
  }

  if (!campaign.budget || campaign.budget <= 0) {
    return NextResponse.json({ error: "Укажите бюджет кампании" }, { status: 400 })
  }

  const payment = await prisma.adPayment.create({
    data: {
      userId: user.id,
      adCampaignId: campaign.id,
      amount: campaign.budget,
      currency: "RUB",
      status: "PAID",
      provider: "internal_stub",
      providerPaymentId: `stub_${Date.now()}`,
      paidAt: new Date(),
    },
  })

  const updated = await prisma.adCampaign.update({
    where: { id: campaign.id },
    data: {
      status: "PENDING_REVIEW",
      spent: 0,
    },
  })

  await logAdCampaignChange(prisma, {
    adCampaignId: id,
    userId: user.id,
    action: "payment_completed",
    newValue: { paymentId: payment.id, amount: payment.amount },
  })

  return NextResponse.json({
    payment,
    campaign: serializeCampaignForClient(updated),
  })
}
