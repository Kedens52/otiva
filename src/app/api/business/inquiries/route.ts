import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

export const dynamic = "force-dynamic"

const schema = z.object({
  toCompanyId: z.string().min(1),
  businessListingId: z.string().optional(),
  type: z.enum(["PRICE_REQUEST", "COMMERCIAL_OFFER", "WHOLESALE_REQUEST", "PARTNERSHIP", "CALLBACK"]).default("PRICE_REQUEST"),
  contactName: z.string().min(2).max(120),
  contactCompany: z.string().max(200).optional(),
  contactPhone: z.string().min(6).max(20),
  contactEmail: z.string().email().optional().or(z.literal("")),
  quantity: z.string().max(120).optional(),
  city: z.string().max(100).optional(),
  message: z.string().max(2000).optional(),
})

const RATE_LIMIT = 10
const RATE_WINDOW_MS = 60 * 60 * 1000

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 })

  const { getUserCompanyAccess } = await import("@/lib/business/access")
  const access = await getUserCompanyAccess(user.id)
  const companyIds = access.map((a) => a.companyId)
  if (companyIds.length === 0) return NextResponse.json({ items: [] })

  const items = await prisma.businessInquiry.findMany({
    where: { toCompanyId: { in: companyIds }, status: { not: "SPAM" } },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  return NextResponse.json({ items })
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Некорректные данные" }, { status: 400 })
  }

  const user = await getCurrentUser()
  const since = new Date(Date.now() - RATE_WINDOW_MS)

  const recentCount = await prisma.businessInquiry.count({
    where: {
      createdAt: { gte: since },
      ...(user
        ? { fromUserId: user.id }
        : { contactPhone: parsed.data.contactPhone }),
    },
  })
  if (recentCount >= RATE_LIMIT) {
    return NextResponse.json({ error: "Слишком много запросов. Попробуйте позже." }, { status: 429 })
  }

  const company = await prisma.company.findFirst({
    where: { id: parsed.data.toCompanyId, isBlocked: false },
    select: { id: true, verificationStatus: true },
  })
  if (!company || company.verificationStatus !== "VERIFIED") {
    return NextResponse.json({ error: "Компания недоступна" }, { status: 404 })
  }

  let fromCompanyId: string | undefined
  if (user) {
    const owned = await prisma.company.findFirst({
      where: { ownerId: user.id },
      select: { id: true },
    })
    fromCompanyId = owned?.id
  }

  const inquiry = await prisma.businessInquiry.create({
    data: {
      fromUserId: user?.id,
      fromCompanyId,
      toCompanyId: parsed.data.toCompanyId,
      businessListingId: parsed.data.businessListingId,
      type: parsed.data.type,
      contactName: parsed.data.contactName,
      contactCompany: parsed.data.contactCompany,
      contactPhone: parsed.data.contactPhone,
      contactEmail: parsed.data.contactEmail || null,
      quantity: parsed.data.quantity,
      city: parsed.data.city,
      message: parsed.data.message,
    },
  })

  return NextResponse.json({ ok: true, id: inquiry.id })
}
