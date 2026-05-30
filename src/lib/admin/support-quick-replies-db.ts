import { prisma } from "@/lib/prisma"
import { DEFAULT_OPERATOR_QUICK_REPLIES } from "@/lib/support/operator-quick-replies"

export async function ensureDefaultOperatorQuickReplies() {
  const count = await prisma.supportOperatorQuickReply.count()
  if (count > 0) return

  await prisma.supportOperatorQuickReply.createMany({
    data: DEFAULT_OPERATOR_QUICK_REPLIES.map((item, index) => ({
      title: item.title,
      category: item.category,
      body: item.body,
      tags: item.tags ?? [],
      active: true,
      sortOrder: item.sortOrder ?? index * 10,
      isFavorite: item.isFavorite ?? false,
    })),
  })
}
