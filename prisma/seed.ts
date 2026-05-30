import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const categories = [
  { name: 'Free',         nameRu: 'Бесплатно / Отдам даром', slug: 'free',        icon: '🎁', description: 'Вещи, которые отдают бесплатно или за самовывоз' },
  { name: 'Goods',        nameRu: 'Товары',           slug: 'goods',       icon: '📦', description: 'Электроника, дом, одежда, хобби и др.' },
  { name: 'Transport',    nameRu: 'Транспорт',        slug: 'cars',        icon: '🚗', description: 'Автомобили, мотоциклы, запчасти' },
  { name: 'Parts',        nameRu: 'Запчасти',         slug: 'parts',       icon: '⚙️', description: 'Запчасти и комплектующие' },
  { name: 'Realty',       nameRu: 'Недвижимость',      slug: 'real-estate', icon: '🏠', description: 'Квартиры, дома, земля' },
  { name: 'Electronics',  nameRu: 'Электроника',       slug: 'electronics', icon: '📱', description: 'Телефоны, компьютеры, техника' },
  { name: 'Home',         nameRu: 'Дом и интерьер',    slug: 'home',        icon: '🛋️', description: 'Мебель, декор, посуда, техника для дома' },
  { name: 'Fashion',      nameRu: 'Одежда и обувь',    slug: 'fashion',     icon: '👗', description: 'Одежда, обувь, аксессуары' },
  { name: 'Kids',         nameRu: 'Детские товары',    slug: 'kids',        icon: '🧸', description: 'Игрушки, одежда, коляски' },
  { name: 'Sport',        nameRu: 'Спорт и отдых',     slug: 'sport',       icon: '⚽', description: 'Спортивный инвентарь, туризм' },
  { name: 'Services',     nameRu: 'Услуги',            slug: 'services',    icon: '🔧', description: 'Ремонт, строительство, репетиторы' },
  { name: 'Jobs',         nameRu: 'Работа',            slug: 'jobs',        icon: '💼', description: 'Вакансии и резюме' },
  { name: 'Animals',      nameRu: 'Животные',          slug: 'animals',     icon: '🐾', description: 'Питомцы, аксессуары для животных' },
  { name: 'Hobby',        nameRu: 'Хобби и досуг',     slug: 'hobby',       icon: '🎨', description: 'Книги, музыка, игры, коллекции' },
  { name: 'Other',        nameRu: 'Другое',            slug: 'other',       icon: '📦', description: 'Разное' },
]

const WANT_TO_BUY_SAMPLES = [
  {
    title: 'Ищу iPhone 14 Pro 256 ГБ',
    description: 'Нужен в хорошем состоянии, цвет не важен. Готов забрать в городе.',
    categorySlug: 'electronics',
    priceMax: 65000,
    city: 'Москва',
    condition: 'USED' as const,
  },
  {
    title: 'Куплю диван угловой',
    description: 'Светлый, без пятен, до 2 м по длине.',
    categorySlug: 'home',
    priceMax: 35000,
    city: 'Санкт-Петербург',
    condition: 'ANY' as const,
  },
  {
    title: 'Нужен велосипед горный',
    description: 'Рама M–L, с переключателями, для города и леса.',
    categorySlug: 'sport',
    priceMax: 25000,
    city: 'Казань',
    condition: 'USED' as const,
  },
]

async function main() {
  console.log('Seeding categories...')
  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name, nameRu: category.nameRu, icon: category.icon },
      create: category,
    })
  }
  console.log(`✓ ${categories.length} categories seeded`)

  const buyer = await prisma.user.findFirst({
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  })

  if (!buyer) {
    console.log('⊘ Пропуск заявок «Куплю»: нет пользователей (создайте хотя бы одного)')
    return
  }

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 30)

  let wtbCount = 0
  for (const sample of WANT_TO_BUY_SAMPLES) {
    const category = await prisma.category.findUnique({
      where: { slug: sample.categorySlug },
      select: { id: true },
    })
    if (!category) continue

    const existing = await prisma.wantToBuy.findFirst({
      where: { userId: buyer.id, title: sample.title },
      select: { id: true },
    })
    if (existing) continue

    await prisma.wantToBuy.create({
      data: {
        userId: buyer.id,
        categoryId: category.id,
        title: sample.title,
        description: sample.description,
        priceMax: sample.priceMax,
        city: sample.city,
        condition: sample.condition,
        status: 'ACTIVE',
        autoApproved: true,
        expiresAt,
      },
    })
    wtbCount += 1
  }
  console.log(`✓ ${wtbCount} заявок «Куплю» (демо)`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
