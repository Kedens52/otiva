import { MARKETPLACE_CATEGORIES } from "@/lib/category-config"
import { prisma } from "@/lib/prisma"
import type { WantToBuyCategoryOption } from "@/lib/want-to-buy/client-types"

/** Категории без БД — как на главной ленте. */
export const STATIC_WANT_TO_BUY_CATEGORIES: WantToBuyCategoryOption[] =
  MARKETPLACE_CATEGORIES.map((c) => ({
    slug: c.slug,
    nameRu: c.title,
  }))

/** Активные категории из Prisma; при ошибке или пустом ответе — статический список. */
export async function loadWantToBuyCategories(): Promise<WantToBuyCategoryOption[]> {
  try {
    const rows = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { nameRu: "asc" }],
      select: { slug: true, nameRu: true },
    })
    if (rows.length > 0) return rows
  } catch (error) {
    console.error("loadWantToBuyCategories:", error)
  }
  return STATIC_WANT_TO_BUY_CATEGORIES
}
