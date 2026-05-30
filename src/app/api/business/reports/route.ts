import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

const schema = z
  .object({
    companyId: z.string().optional(),
    businessListingId: z.string().optional(),
    reason: z.enum(["fraud", "prohibited", "spam", "false_info", "wrong_price", "other"]),
    comment: z.string().max(1000).optional(),
  })
  .refine((v) => Boolean(v.companyId || v.businessListingId), {
    message: "Укажите компанию или B2B-объявление",
  })

const RATE_LIMIT = 5
const WINDOW_MS = 60 * 60 * 1000

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  const body = await request.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Некорректные данные" }, { status: 400 })
  }

  const since = new Date(Date.now() - WINDOW_MS)
  const recent = await prisma.report.count({
    where: {
      createdAt: { gte: since },
      ...(parsed.data.companyId ? { companyId: parsed.data.companyId } : {}),
    },
  })
  if (recent >= RATE_LIMIT && !user) {
    return NextResponse.json({ error: "Слишком много жалоб. Попробуйте позже." }, { status: 429 })
  }

  if (parsed.data.companyId) {
    const c = await prisma.company.findUnique({ where: { id: parsed.data.companyId }, select: { id: true } })
    if (!c) return NextResponse.json({ error: "Компания не найдена" }, { status: 404 })
  }
  if (parsed.data.businessListingId) {
    const l = await prisma.businessListing.findUnique({
      where: { id: parsed.data.businessListingId },
      select: { id: true },
    })
    if (!l) return NextResponse.json({ error: "Объявление не найдено" }, { status: 404 })
  }

  await prisma.report.create({
    data: {
      companyId: parsed.data.companyId ?? null,
      businessListingId: parsed.data.businessListingId ?? null,
      reason: parsed.data.reason,
      reportCategory: "b2b",
      comment: parsed.data.comment ?? "",
    },
  })

  return NextResponse.json({ ok: true })
}
