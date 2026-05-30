import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { canRegisterCompany, isInnTaken } from "@/lib/business/guards"
import { isValidInn, isValidOgrn, normalizeInn, normalizeOgrn, slugifyCompanyName } from "@/lib/business/validation"
import { getUserCompanyAccess } from "@/lib/business/access"

export const dynamic = "force-dynamic"

const registerSchema = z.object({
  name: z.string().min(2).max(200),
  legalName: z.string().max(200).optional(),
  inn: z.string().min(10).max(12),
  ogrn: z.string().max(15).optional(),
  kpp: z.string().max(9).optional(),
  companyType: z.enum(["IP", "LLC", "SELF_EMPLOYED", "COMPANY", "OTHER"]),
  businessRole: z.enum([
    "SUPPLIER", "BUYER", "MANUFACTURER", "DISTRIBUTOR", "WHOLESALER",
    "SERVICE_PROVIDER", "INVESTOR", "FRANCHISOR", "BUSINESS_SELLER", "BUSINESS_BUYER",
  ]),
  industry: z.string().max(120).optional(),
  region: z.string().max(100).optional(),
  city: z.string().min(1).max(100),
  contactName: z.string().min(2).max(120),
  contactRole: z.string().max(80).optional(),
  contactPhone: z.string().max(20).optional(),
  contactEmail: z.string().email().optional().or(z.literal("")),
  websiteUrl: z.string().max(300).optional(),
  vkUrl: z.string().max(300).optional(),
  maxUrl: z.string().max(300).optional(),
  description: z.string().max(3000).optional(),
})

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams
  const publicOnly = sp.get("public") === "1"
  const city = sp.get("city") ?? undefined
  const take = Math.min(50, Number.parseInt(sp.get("limit") ?? "24", 10) || 24)

  if (publicOnly) {
    const items = await prisma.company.findMany({
      where: {
        isPublic: true,
        verificationStatus: "VERIFIED",
        isBlocked: false,
        ...(city ? { city: { equals: city, mode: "insensitive" } } : {}),
      },
      select: {
        id: true,
        name: true,
        city: true,
        region: true,
        industry: true,
        businessRole: true,
        publicSlug: true,
        verificationStatus: true,
        _count: { select: { listings: true } },
      },
      orderBy: { createdAt: "desc" },
      take,
    })
    return NextResponse.json({ items })
  }

  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 })
  }

  const access = await getUserCompanyAccess(user.id)
  const ids = access.map((a) => a.companyId)
  const items = await prisma.company.findMany({
    where: { id: { in: ids } },
    orderBy: { updatedAt: "desc" },
  })

  return NextResponse.json({ items, access })
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 })
  }

  if (!user.isVerified && !user.phone) {
    return NextResponse.json(
      { error: "Подтвердите телефон в личном профиле Нашло перед регистрацией бизнеса." },
      { status: 403 },
    )
  }

  const gate = await canRegisterCompany(user.id)
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: 403 })
  }

  try {
    const body = await request.json()
    const data = registerSchema.parse(body)

    if (!isValidInn(data.inn)) {
      return NextResponse.json({ error: "Некорректный ИНН" }, { status: 400 })
    }
    if (data.ogrn && !isValidOgrn(data.ogrn)) {
      return NextResponse.json({ error: "Некорректный ОГРН/ОГРНИП" }, { status: 400 })
    }

    const innNorm = normalizeInn(data.inn)
    if (await isInnTaken(innNorm)) {
      return NextResponse.json(
        { error: "Компания с таким ИНН уже зарегистрирована. Обратитесь в поддержку." },
        { status: 409 },
      )
    }

    let slugBase = slugifyCompanyName(data.name)
    if (!slugBase) slugBase = "company"
    let publicSlug = slugBase
    let n = 0
    while (await prisma.company.findUnique({ where: { publicSlug } })) {
      n += 1
      publicSlug = `${slugBase}-${n}`
    }

    const company = await prisma.$transaction(async (tx) => {
      const created = await tx.company.create({
        data: {
          ownerId: user.id,
          name: data.name.trim(),
          legalName: data.legalName?.trim(),
          inn: innNorm,
          ogrn: data.ogrn ? normalizeOgrn(data.ogrn) : null,
          kpp: data.kpp?.trim(),
          companyType: data.companyType,
          businessRole: data.businessRole,
          industry: data.industry?.trim(),
          region: data.region?.trim(),
          city: data.city.trim(),
          contactName: data.contactName.trim(),
          contactRole: data.contactRole?.trim(),
          contactPhone: data.contactPhone?.trim() ?? user.phone,
          contactEmail: data.contactEmail?.trim() || null,
          websiteUrl: data.websiteUrl?.trim(),
          vkUrl: data.vkUrl?.trim(),
          maxUrl: data.maxUrl?.trim(),
          description: data.description?.trim(),
          verificationStatus: "PENDING_REVIEW",
          isPublic: false,
          publicSlug,
        },
      })

      await tx.companyMember.create({
        data: {
          companyId: created.id,
          userId: user.id,
          role: "OWNER",
          acceptedAt: new Date(),
        },
      })

      return created
    })

    return NextResponse.json({ company }, { status: 201 })
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors[0]?.message ?? "Неверные данные" }, { status: 400 })
    }
    console.error("business companies POST:", e)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}
