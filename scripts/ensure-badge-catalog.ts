/**
 * Создаёт строки в таблице Badge (каталог значков).
 * Запуск на сервере: npx tsx scripts/ensure-badge-catalog.ts
 */
import { prisma } from "../src/lib/prisma"
import { ensureBadgeCatalog } from "../src/lib/badges/sync-user-badges"

async function main() {
  await ensureBadgeCatalog(prisma)
  const count = await prisma.badge.count()
  console.log(`Badge catalog OK, rows: ${count}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
