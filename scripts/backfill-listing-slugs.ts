/**
 * Заполняет slug у объявлений, где slug IS NULL.
 * Запуск: npx tsx scripts/backfill-listing-slugs.ts
 */
import { PrismaClient } from "@prisma/client"
import { syncListingSlug } from "../src/lib/seo/sync-listing-slug"

const prisma = new PrismaClient()

async function main() {
  const rows = await prisma.listing.findMany({
    where: { OR: [{ slug: null }, { slug: "" }] },
    select: { id: true, title: true },
    take: 5000,
  })

  if (!rows.length) {
    console.log("Все объявления уже имеют slug.")
    return
  }

  console.log(`Обновляем slug для ${rows.length} объявлений…`)
  let ok = 0
  for (const row of rows) {
    try {
      await syncListingSlug(row.id)
      ok += 1
    } catch (error) {
      console.error(`  ✗ ${row.id} (${row.title}):`, error)
    }
  }
  console.log(`Готово: ${ok}/${rows.length}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
