import webpush from "web-push"
import { prisma } from "@/lib/prisma"

let vapidConfigured = false

function ensureVapidConfigured(): boolean {
  if (vapidConfigured) return true
  const publicKey = process.env.VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  const subject = process.env.VAPID_EMAIL || "mailto:support@nashlo.ru"
  if (!publicKey || !privateKey) return false
  webpush.setVapidDetails(subject, publicKey, privateKey)
  vapidConfigured = true
  return true
}

type UserNotificationSettings = {
  newMessage?: boolean
}

function wantsNewMessagePush(raw: unknown): boolean {
  if (raw == null || typeof raw !== "object") return true
  const s = raw as UserNotificationSettings
  return s.newMessage !== false
}

export type WebPushPayload = {
  title: string
  body: string
  url?: string
  tag?: string
}

/** Отправить web-push всем подпискам пользователя. Не бросает наружу. */
export async function sendWebPushToUser(
  userId: string,
  payload: WebPushPayload,
  options?: { respectNewMessageSetting?: boolean },
): Promise<void> {
  if (!ensureVapidConfigured()) return

  if (options?.respectNewMessageSetting !== false) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { notificationSettings: true },
    })
    if (!wantsNewMessagePush(user?.notificationSettings)) return
  }

  const subs = await prisma.pushSubscription.findMany({ where: { userId } })
  if (!subs.length) return

  const body = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url ?? "/chat",
    tag: payload.tag ?? "nashlo",
  })

  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          body,
          { TTL: 3600 },
        )
      } catch (e: unknown) {
        const status = (e as { statusCode?: number })?.statusCode
        if (status === 404 || status === 410) {
          await prisma.pushSubscription.deleteMany({ where: { id: sub.id } }).catch(() => {})
        } else {
          console.error("web-push send error:", status, e)
        }
      }
    }),
  )
}
