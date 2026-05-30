import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { businessConversationWhere, countUnreadInConversation } from "@/lib/messaging/scope"
import { getBusinessMessageAccess } from "@/lib/messaging/business-access"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ unread: 0 })
  }

  const companyId = request.nextUrl.searchParams.get("companyId")
  const { companyIds, primaryCompanyId } = await getBusinessMessageAccess(user.id)
  if (companyIds.length === 0) {
    return NextResponse.json({ unread: 0 })
  }

  const activeCompanyId =
    companyId && companyIds.includes(companyId) ? companyId : primaryCompanyId

  const conversations = await prisma.conversation.findMany({
    where: businessConversationWhere(
      user.id,
      activeCompanyId ? [activeCompanyId] : companyIds,
    ),
    select: {
      id: true,
      members: { where: { userId: user.id }, select: { lastReadAt: true } },
    },
  })

  let unread = 0
  for (const conv of conversations) {
    const member = conv.members[0]
    unread += await countUnreadInConversation(conv.id, user.id, member?.lastReadAt)
  }

  return NextResponse.json({ unread, companyId: activeCompanyId })
}
