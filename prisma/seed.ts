import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const categories = [
  { name: 'Transport',    nameRu: 'Транспорт',        slug: 'cars',        icon: '🚗', description: 'Автомобили, мотоциклы, запчасти' },
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
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
