import type { NotificationType, Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { sendWebPushToUser } from "@/lib/push/send-web-push"
import {
  wantsWantToBuyNotification,
  type WantToBuyPrefKey,
} from "@/lib/want-to-buy/notification-prefs"

type DispatchParams = {
  userId: string
  type: NotificationType
  title: string
  body: string
  link?: string | null
  data?: Prisma.InputJsonValue
  prefKey: WantToBuyPrefKey
  pushTag?: string
}

async function dispatchWantToBuyNotification(params: DispatchParams): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: { notificationSettings: true },
  })
  if (!user) return
  if (!wantsWantToBuyNotification(user.notificationSettings, params.prefKey)) return

  try {
    await prisma.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        body: params.body,
        link: params.link ?? null,
        data: params.data,
      },
    })
  } catch (error) {
    console.error("dispatchWantToBuyNotification:", error)
    return
  }

  void sendWebPushToUser(
    params.userId,
    {
      title: params.title,
      body: params.body.slice(0, 180),
      url: params.link ?? "/profile/want-to-buy",
      tag: params.pushTag ?? `wtb-${params.type}`,
    },
    { respectNewMessageSetting: false },
  ).catch((e) => console.error("want-to-buy web-push:", e))
}

export async function notifyWantToBuyNewOffer(params: {
  buyerUserId: string
  sellerName: string | null
  wantToBuyId: string
  title: string
}): Promise<void> {
  const sellerLabel = params.sellerName?.trim() || "Продавец"
  await dispatchWantToBuyNotification({
    userId: params.buyerUserId,
    type: "WANT_TO_BUY_NEW_OFFER",
    title: "Новый отклик",
    body: `${sellerLabel} предложил товар по вашей заявке «${params.title}»`,
    link: `/profile/want-to-buy/${params.wantToBuyId}/offers`,
    data: { wantToBuyId: params.wantToBuyId },
    prefKey: "newOffer",
    pushTag: `wtb-offer-${params.wantToBuyId}`,
  })
}

export async function notifyWantToBuyOfferAccepted(params: {
  sellerUserId: string
  wantToBuyId: string
}): Promise<void> {
  await dispatchWantToBuyNotification({
    userId: params.sellerUserId,
    type: "WANT_TO_BUY_OFFER_ACCEPTED",
    title: "Предложение принято",
    body: "Ваше предложение принято. Покупатель ждёт связи.",
    link: "/profile/my-offers",
    data: { wantToBuyId: params.wantToBuyId },
    prefKey: "offerStatus",
    pushTag: `wtb-accepted-${params.wantToBuyId}`,
  })
}

export async function notifyWantToBuyOfferDeclined(params: {
  sellerUserId: string
  title: string
  wantToBuyId: string
}): Promise<void> {
  await dispatchWantToBuyNotification({
    userId: params.sellerUserId,
    type: "WANT_TO_BUY_OFFER_DECLINED",
    title: "Предложение отклонено",
    body: `Ваше предложение по заявке «${params.title}» не подошло.`,
    link: "/profile/my-offers",
    data: { wantToBuyId: params.wantToBuyId },
    prefKey: "offerStatus",
    pushTag: `wtb-declined-${params.wantToBuyId}`,
  })
}

export async function notifyWantToBuyRejected(params: {
  buyerUserId: string
  title: string
  wantToBuyId: string
  reason?: string | null
}): Promise<void> {
  const reasonSuffix = params.reason?.trim()
    ? ` Причина: ${params.reason.trim()}`
    : " Проверьте данные и создайте заявку заново."
  await dispatchWantToBuyNotification({
    userId: params.buyerUserId,
    type: "WANT_TO_BUY_REJECTED",
    title: "Заявка отклонена",
    body: `Ваша заявка «${params.title}» отклонена.${reasonSuffix}`,
    link: `/profile/want-to-buy`,
    data: { wantToBuyId: params.wantToBuyId },
    prefKey: "rejected",
    pushTag: `wtb-rejected-${params.wantToBuyId}`,
  })
}

export async function notifyWantToBuyExpiringSoon(params: {
  buyerUserId: string
  title: string
  wantToBuyId: string
  daysLeft: number
}): Promise<void> {
  const daysLabel =
    params.daysLeft === 1
      ? "1 день"
      : params.daysLeft < 5
        ? `${params.daysLeft} дня`
        : `${params.daysLeft} дней`
  await dispatchWantToBuyNotification({
    userId: params.buyerUserId,
    type: "WANT_TO_BUY_EXPIRING_SOON",
    title: "Заявка скоро истекает",
    body: `Ваша заявка «${params.title}» истекает через ${daysLabel}. Продлить?`,
    link: `/profile/want-to-buy`,
    data: { wantToBuyId: params.wantToBuyId },
    prefKey: "expiring",
    pushTag: `wtb-expire-${params.wantToBuyId}`,
  })
}
