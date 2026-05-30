#!/usr/bin/env node
/**
 * Каталог значков в БД (без tsx). На сервере: node scripts/ensure-badge-catalog.js
 */
const { PrismaClient } = require("@prisma/client")

const prisma = new PrismaClient()

const CATALOG = [
  {
    code: "BEGINNER",
    title: "В начале пути",
    subtitle: "Вы недавно с нами",
    description:
      "Пользователь недавно зарегистрировался на Нашло и только начинает пользоваться платформой.",
    icon: "/badges/beginner.png",
    priority: 1,
  },
  {
    code: "FIRST_STEP",
    title: "Первый шаг",
    subtitle: "Профиль заполнен",
    description: "Пользователь зарегистрировался на Нашло и полностью заполнил профиль.",
    icon: "/badges/pervii.png",
    priority: 5,
  },
  {
    code: "VERIFIED",
    title: "Проверен",
    subtitle: "Данные подтверждены",
    description: "Пользователь подтвердил контактные данные.",
    icon: "/badges/verified.png",
    priority: 10,
  },
  {
    code: "ACTIVE",
    title: "Активный",
    subtitle: "Быстро отвечает",
    description:
      "Пользователь часто заходит на сайт, быстро отвечает и поддерживает объявления актуальными.",
    icon: "/badges/active.png",
    priority: 20,
  },
  {
    code: "TRUSTED",
    title: "Надёжный",
    subtitle: "Хорошая история",
    description: "У пользователя хорошая история, высокий рейтинг и нет жалоб.",
    icon: "/badges/trusted.png",
    priority: 30,
  },
  {
    code: "SAFE_DEAL",
    title: "Безопасная сделка",
    subtitle: "Оплата защищена",
    description: "Пользователь принимает оплату через безопасную сделку Нашло.",
    icon: "/badges/safe-deal.png",
    priority: 35,
  },
  {
    code: "PRO",
    title: "Профи",
    subtitle: "Проверенный специалист",
    description: "Профиль прошёл дополнительную проверку Нашло.",
    icon: "/badges/pro.png",
    priority: 40,
  },
  {
    code: "PREMIUM",
    title: "Премиум",
    subtitle: "Усиленный профиль",
    description: "У пользователя активен премиум-статус.",
    icon: "/badges/premium.png",
    priority: 50,
  },
]

async function main() {
  for (const def of CATALOG) {
    try {
      await prisma.badge.upsert({
        where: { code: def.code },
        create: { ...def, isActive: true },
        update: {
          title: def.title,
          subtitle: def.subtitle,
          description: def.description,
          icon: def.icon,
          priority: def.priority,
          isActive: true,
        },
      })
      console.log(`  OK ${def.code} -> ${def.icon}`)
    } catch (e) {
      console.warn(`  SKIP ${def.code}:`, e.message)
    }
  }
  const count = await prisma.badge.count()
  console.log(`Badge catalog done, rows: ${count}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
