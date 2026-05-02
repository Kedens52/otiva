import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { z } from 'zod'
import { Prisma, type ListingStatus } from '@prisma/client'

const createSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().min(10).max(3000),
  price: z.number().min(0).max(1_000_000_000),
  categorySlug: z.string(),
  images: z.array(z.string()).max(10).default([]),
  video: z.string().max(500).optional(),
  location: z.string().max(300).optional(),
  city: z.string().max(100).optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  attributes: z.record(z.unknown()).optional(),
})

// Basic content moderation
const SPAM_PATTERNS = [
  /(.)\1{6,}/i,           // repeated chars: aaaaaaa
  /[A-ZА-ЯЁ]{10,}/,      // too many caps
  /\b(казино|casino|займ онлайн|кредит без|быстрые деньги)\b/i,
]
function isSpam(text: string): boolean {
  return SPAM_PATTERNS.some((p) => p.test(text))
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const pageSize = Math.min(50, parseInt(searchParams.get('pageSize') || '20'))
    const categorySlug = searchParams.get('category')
    const city = searchParams.get('city')
    const query = searchParams.get('q')
    const priceMin = searchParams.get('priceMin') ? parseInt(searchParams.get('priceMin')!) : undefined
    const priceMax = searchParams.get('priceMax') ? parseInt(searchParams.get('priceMax')!) : undefined
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc'

    const where: Record<string, unknown> = {
      status: 'ACTIVE' as ListingStatus,
    }

    if (categorySlug) where.category = { slug: categorySlug }
    if (city) where.city = city
    if (query) {
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ]
    }
    if (priceMin !== undefined || priceMax !== undefined) {
      where.price = {}
      if (priceMin !== undefined) (where.price as Record<string, number>).gte = priceMin
      if (priceMax !== undefined) (where.price as Record<string, number>).lte = priceMax
    }

    const validSortFields = ['createdAt', 'price', 'views']
    const orderByField = validSortFields.includes(sortBy) ? sortBy : 'createdAt'

    const [items, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        include: {
          seller: {
            select: {
              id: true,
              name: true,
              avatar: true,
              phone: true,
              rating: true,
              reviewCount: true,
              isVerified: true,
            },
          },
          category: true,
          _count: { select: { favorites: true } },
        },
        orderBy: { [orderByField]: sortOrder },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.listing.count({ where }),
    ])

    return NextResponse.json({
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    })
  } catch (error) {
    console.error('listings GET error:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const body = await request.json()
    const data = createSchema.parse(body)

    if (isSpam(data.title) || isSpam(data.description)) {
      return NextResponse.json({ error: 'Объявление не прошло проверку. Убедитесь, что текст написан нормально.' }, { status: 400 })
    }

    const category = await prisma.category.findUnique({
      where: { slug: data.categorySlug },
    })

    if (!category) {
      return NextResponse.json({ error: 'Категория не найдена' }, { status: 400 })
    }

    const listing = await prisma.listing.create({
      data: {
        title: data.title,
        description: data.description,
        price: data.price,
        images: data.images,
        video: data.video,
        location: data.location,
        city: data.city,
        lat: data.lat,
        lng: data.lng,
        attributes: data.attributes as Prisma.InputJsonValue | undefined,
        status: 'MODERATION',
        categoryId: category.id,
        sellerId: user.id,
      },
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            avatar: true,
            phone: true,
            rating: true,
            reviewCount: true,
            isVerified: true,
          },
        },
        category: true,
      },
    })

    return NextResponse.json({ listing }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error('listings POST error:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
