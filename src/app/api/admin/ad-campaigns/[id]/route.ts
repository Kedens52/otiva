import { NextResponse } from "next/server"
import { z } from "zod"
import { AdStatus } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { withAdminApi } from "@/lib/admin/guards"

export const dynamic = "force-dynamic"

const patchSchema = z.object({
  status: z.nativeEnum(AdStatus).optional(),
})

export const DELETE = withAdminApi(async ({ req }) => {
  const id = req.nextUrl.pathname.split("/").at(-1) ?? ""
  await prisma.adCampaign.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}, "settings.manage")

export const PATCH = withAdminApi(async ({ req }) => {
  const id = req.nextUrl.pathname.split("/").at(-1) ?? ""
  const input = patchSchema.parse(await req.json())
  const campaign = await prisma.adCampaign.update({
    where: { id },
    data: input,
  })
  return NextResponse.json({ campaign })
}, "settings.manage")
