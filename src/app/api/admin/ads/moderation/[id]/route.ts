import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { withAdminApi } from "@/lib/admin/guards"
import { logAdCampaignChange, serializeCampaignForClient } from "@/lib/ads/campaign-service"

export const dynamic = "force-dynamic"

const bodySchema = z.object({
  action: z.enum(["approve", "reject", "needs_changes", "block"]),
  note: z.string().max(2000).optional(),
})

function campaignId(req: NextRequest) {
  return req.nextUrl.pathname.split("/").filter(Boolean).at(-1) ?? ""
}

export const POST = withAdminApi(async ({ staff, req }) => {
  const id = campaignId(req)
  const { action, note } = bodySchema.parse(await req.json())

  const campaign = await prisma.adCampaign.findUnique({ where: { id } })
  if (!campaign) return NextResponse.json({ error: "Не найдено" }, { status: 404 })

  let status = campaign.status
  let moderationNote = note?.trim() || null

  if (action === "approve") {
    status = "ACTIVE"
    moderationNote = null
  } else if (action === "reject") {
    status = "REJECTED"
    if (!moderationNote) {
      return NextResponse.json({ error: "Укажите причину отклонения" }, { status: 400 })
    }
  } else if (action === "needs_changes") {
    status = "NEEDS_CHANGES"
    if (!moderationNote) {
      return NextResponse.json({ error: "Укажите, что нужно исправить" }, { status: 400 })
    }
  } else if (action === "block") {
    status = "ARCHIVED"
    moderationNote = moderationNote ?? "Заблокировано модератором"
  }

  const updated = await prisma.adCampaign.update({
    where: { id },
    data: { status, moderationNote },
  })

  await logAdCampaignChange(prisma, {
    adCampaignId: id,
    userId: staff.id,
    action: `moderation_${action}`,
    oldValue: { status: campaign.status },
    newValue: { status, moderationNote },
  })

  return NextResponse.json({ campaign: serializeCampaignForClient(updated) })
}, "settings.manage")
