import { prisma } from "@/lib/prisma"
import { sendWebPushToUser } from "@/lib/push/send-web-push"

export async function notifyRecipientNewMessage(params: {
  recipientUserId: string
  senderName: string | null
  messageText: string
  conversationId: string
  linkPath?: string
}): Promise<void> {
  const { recipientUserId, senderName, messageText, conversationId, linkPath } = params
  const preview = messageText.trim().slice(0, 200)
  const link = linkPath ?? `/messages/${conversationId}`
  const title = "Новое сообщение"
  const bodyLine = senderName ? `${senderName}: ${preview}` : preview

  try {
    await prisma.notification.create({
      data: {
        userId: recipientUserId,
        type: "NEW_MESSAGE",
        title,
        body: bodyLine,
        link,
        data: { conversationId },
      },
    })
  } catch (e) {
    console.error("notifyRecipientNewMessage DB:", e)
  }

  void sendWebPushToUser(
    recipientUserId,
    {
      title,
      body: bodyLine.slice(0, 180),
      url: link,
      tag: `msg-${conversationId}`,
    },
    { respectNewMessageSetting: true },
  ).catch((e) => console.error("notifyRecipientNewMessage push:", e))
}
