import type { BonusReason } from "@prisma/client"

/** Сколько баллов за действие (положительные = начисление). */
export const BONUS_AMOUNTS: Record<BonusReason, number> = {
  WELCOME: 5,
  PHONE_VERIFIED: 20,
  PROFILE_COMPLETE: 20,
  AVATAR_ADDED: 10,
  FIRST_QUALITY_LISTING: 40,
  QUALITY_LISTING: 15,
  SHARE_VK: 10,
  SHARE_MAX: 10,
  FAST_RESPONSE_DAY: 3,
  DEAL_COMPLETED: 30,
  REVIEW_LEFT: 10,
  POSITIVE_REVIEW_RECEIVED: 15,
  REFERRAL_REGISTERED: 10,
  REFERRAL_ACTIVE: 40,
  SPEND_BUMP: -100,
  SPEND_HIGHLIGHT: -150,
  SPEND_RECOMMENDATIONS: -200,
  SPEND_AUTOBOOST: -350,
  SPEND_PROMO_DISCOUNT: -100,
  ADMIN_ADJUST: 0,
  REVERSAL: 0,
}

export const BONUS_LIMITS = {
  dailyEarnCap: 120,
  weeklyEarnCap: 400,
  sharePerListingPerPlatformPerWeek: 1,
  sharePerDay: 3,
  qualityListingsPerDay: 2,
  fastResponsePerDay: 1,
} as const

/** Стоимость продвижения за баллы (мягкое, не заменяет рублёвое). */
export const BONUS_SPEND_OFFERS = {
  BUMP_1D: { reason: "SPEND_BUMP" as BonusReason, points: 100, days: 1, service: "BUMP" as const },
  HIGHLIGHT_3D: { reason: "SPEND_HIGHLIGHT" as BonusReason, points: 150, days: 3, service: "HIGHLIGHT" as const },
  RECOMMENDATIONS_1D: { reason: "SPEND_RECOMMENDATIONS" as BonusReason, points: 200, days: 1, service: "RECOMMENDATIONS" as const },
  AUTOBOOST_3D: { reason: "SPEND_AUTOBOOST" as BonusReason, points: 350, days: 3, service: "AUTOBOOST" as const },
  PROMO_DISCOUNT: { reason: "SPEND_PROMO_DISCOUNT" as BonusReason, points: 100, days: 30, service: "PROMO_DISCOUNT" as const },
} as const

export const BONUS_REASON_LABELS: Record<BonusReason, string> = {
  WELCOME: "Добро пожаловать на Нашло",
  PHONE_VERIFIED: "Телефон подтверждён",
  PROFILE_COMPLETE: "Профиль заполнен",
  AVATAR_ADDED: "Добавлено фото профиля",
  FIRST_QUALITY_LISTING: "Первое качественное объявление",
  QUALITY_LISTING: "Качественное объявление",
  SHARE_VK: "Поделились во ВКонтакте",
  SHARE_MAX: "Поделились в МАХ",
  FAST_RESPONSE_DAY: "Быстрые ответы за день",
  DEAL_COMPLETED: "Завершённая сделка",
  REVIEW_LEFT: "Оставлен отзыв",
  POSITIVE_REVIEW_RECEIVED: "Положительный отзыв",
  REFERRAL_REGISTERED: "Друг зарегистрировался",
  REFERRAL_ACTIVE: "Приглашённый разместил объявление",
  SPEND_BUMP: "Поднятие объявления за баллы",
  SPEND_HIGHLIGHT: "Выделение объявления за баллы",
  SPEND_RECOMMENDATIONS: "Рекомендации за баллы",
  SPEND_AUTOBOOST: "Автоподнятие за баллы",
  SPEND_PROMO_DISCOUNT: "Скидка на продвижение",
  ADMIN_ADJUST: "Корректировка администратором",
  REVERSAL: "Отмена начисления",
}

export const EARN_GUIDE = [
  { key: "welcome",  title: "Регистрация",                   points: "+5",   hint: "Приветственные баллы" },
  { key: "phone",    title: "Подтвердите телефон",           points: "+20",  hint: "Верификация по SMS" },
  { key: "profile",  title: "Заполните профиль",             points: "+20",  hint: "Имя, город, описание, фото" },
  { key: "listing",  title: "Качественное объявление",       points: "+40",  hint: "3+ фото и подробное описание (первое)" },
  { key: "listing2", title: "Повторное качественное",        points: "+15",  hint: "3+ фото, описание от 50 символов" },
  { key: "share_vk", title: "Поделитесь во ВКонтакте",       points: "+10",  hint: "За объявление, раз в неделю" },
  { key: "share_max",title: "Поделитесь в МАХ",              points: "+10",  hint: "За объявление, раз в неделю" },
  { key: "deal",     title: "Завершите сделку",              points: "+30",  hint: "После подтверждения сделки" },
  { key: "review",   title: "Оставьте отзыв",                points: "+10",  hint: "После сделки" },
  { key: "review_r", title: "Получите положительный отзыв",  points: "+15",  hint: "Покупатель оценил на 4–5 звёзд" },
  { key: "referral", title: "Пригласите друга",              points: "+40",  hint: "Когда друг разместит первое объявление" },
] as const

export const SPEND_GUIDE = [
  { key: "bump",            title: "Поднятие на 1 день",       points: "100",  service: "BUMP" },
  { key: "highlight",       title: "Выделение на 3 дня",       points: "150",  service: "HIGHLIGHT" },
  { key: "recommendations", title: "Рекомендации на 1 день",   points: "200",  service: "RECOMMENDATIONS" },
  { key: "autoboost",       title: "Автоподъем на 3 дня",    points: "350",  service: "AUTOBOOST" },
  { key: "promo_discount",  title: "Скидка на продвижение",    points: "100",  service: "PROMO_DISCOUNT" },
] as const
