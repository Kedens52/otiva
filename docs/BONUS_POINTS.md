# Баллы Нашло — внутренняя документация

> Документ для команды и разработки. Не публикуется на сайте. Пользователь видит только кабинет `/profile/bonuses` и краткие подсказки в UI.

## 1. Назначение

**Баллы** — внутренняя валюта лояльности. Не выводятся, не передаются между пользователями, не конвертируются в рубли. Единственное массовое применение — **мягкое продвижение объявлений** (поднятие / выделение) без оплаты картой.

Отдельно от баллов:

| Сущность | Поле / модель | Назначение |
|----------|---------------|------------|
| Кошелёк (рубли) | `User.walletBalance`, `WalletTransaction` | Пополнение через T-Bank, платное продвижение |
| Баллы | `User.bonusBalance`, `BonusTransaction` | Награды за активность, списание на BUMP/HIGHLIGHT |
| Значки | `UserBadge`, `Badge` | Визуальный статус, **не** влияют на баланс |
| Trust tier | `User.trustTier` | Модерация / лимиты, **не** начисление баллов |

---

## 2. Архитектура кода

```
src/lib/bonuses/
  rules.ts      — суммы, лимиты, подписи, EARN_GUIDE / SPEND_GUIDE для API
  quality.ts    — критерий «качественного» объявления
  service.ts    — awardBonus, spendBonus, reverse, adminAdjust
  hooks.ts      — триггеры по событиям (регистрация, listing, share, deal, review, referral)

src/app/api/
  profile/bonuses/route.ts   — GET баланс, история, гайды для кабинета
  bonuses/spend/route.ts     — POST списание на BUMP_1D / HIGHLIGHT_3D
  share/route.ts             — POST шаринг → recordShareBonus
  referrals/apply/route.ts   — применение реферального кода
  admin/bonuses/             — просмотр, adjust, block

prisma:
  BonusTransaction, BonusShareEvent, Referral
  User.bonusBalance, User.bonusBlocked, User.referralCode
```

Миграция: `20260521120000_nashlo_bonus_points` (и связанные поля в `User` / `Listing`).

---

## 3. Начисление (таблица)

Источник сумм: `BONUS_AMOUNTS` в `rules.ts`. Дефолт при `awardBonus` без `amount`.

| Reason | Баллы | Частота | referenceKey (типично) |
|--------|------|---------|-------------------------|
| `WELCOME` | 5 | 1× | `once:WELCOME` |
| `PHONE_VERIFIED` | 15 | 1× | `once:PHONE_VERIFIED` |
| `AVATAR_ADDED` | 10 | 1× | `once:AVATAR_ADDED` |
| `PROFILE_COMPLETE` | 25 | 1× | `once:PROFILE_COMPLETE` |
| `FIRST_QUALITY_LISTING` | 35 | 1× | `once:FIRST_QUALITY_LISTING` |
| `QUALITY_LISTING` | 8 | до 2/день | `listing:{listingId}` |
| `SHARE_VK` | 8 | см. лимиты шаринга | `share:{listingId}:VK` |
| `SHARE_MAX` | 8 | см. лимиты шаринга | `share:{listingId}:MAX` |
| `DEAL_COMPLETED` | 25 | за сделку | `deal:{dealId}:seller` / `:buyer` |
| `REVIEW_LEFT` | 12 | за отзыв | `review:{reviewId}:author` |
| `POSITIVE_REVIEW_RECEIVED` | 18 | отзыв ≥4★ | `review:{reviewId}:target` |
| `REFERRAL_REGISTERED` | 10 | за приглашённого | `referral:reg:{userId}` |
| `REFERRAL_ACTIVE` | 40 | реферал выложил quality listing | `referral:active:{userId}` |
| `FAST_RESPONSE_DAY` | 5 | **в rules, хук не подключён** | — |
| `ADMIN_ADJUST` | любое | админка | `admin:{timestamp}:…` |

### Глобальные лимиты earn

- **80 баллов / сутки** (сумма `EARN` + `APPROVED` + `amount > 0`)
- **250 баллов / неделя**

При превышении `awardBonus` → `code: LIMIT`.

### Качественное объявление

`isQualityListing()` (`quality.ts`):

- `status === ACTIVE` (если передан)
- заголовок ≥ 8 символов
- описание ≥ 50 символов
- **≥ 3 фото**

Нужно для: `QUALITY_LISTING`, `FIRST_QUALITY_LISTING`, `REFERRAL_ACTIVE`, списание баллов на продвижение.

---

## 4. Триггеры (когда вызывается код)

| Событие | Функция | Файл |
|---------|---------|------|
| Первая регистрация (OAuth / телефон) | `tryWelcomeBonus` | `verify-code`, `vk/yandex callback` |
| После verify телефона | `tryPhoneVerifiedBonus` | `verify-code` |
| Обновление профиля (аватар / полнота) | `tryProfileBonuses` | `api/profile` PATCH |
| Создание объявления ACTIVE + quality | `tryListingBonuses` | `api/listings` POST |
| Шаринг объявления VK/MAX | `recordShareBonus` | `api/share` |
| Завершение сделки | `tryDealCompletedBonuses` | `api/deals` |
| Публикация отзыва | `tryReviewBonuses` | `api/reviews` |
| Ввод реф. кода при регистрации | `applyReferralCode` | `verify-code` + `api/referrals/apply` |

Все вызовы из hooks — **fire-and-forget** (`void …catch()`), ошибки не ломают основной flow.

---

## 5. Шаринг

1. Только авторизованный владелец объявления.
2. `BonusShareEvent` — запись факта шаринга.
3. Лимиты:
   - **3 шаринга / сутки** (любые объявления)
   - **1 раз / неделю** на пару `(listingId, platform)`
   - недельный потолок ≈ `sharePerDay * 7` в коде hooks
4. URL: `buildVkShareUrl`, `buildMaxShareUrl` в `hooks.ts`.

---

## 6. Реферальная программа

Модель `Referral`: `referrerId`, `referredUserId`, `status` (`PENDING` → `ACTIVE`).

1. У каждого пользователя `referralCode` (генерируется `ensureReferralCode`).
2. Регистрация по `?ref=CODE` → `applyReferralCode` → +10 баллов рефереру, статус `PENDING`.
3. Когда приглашённый публикует **quality** объявление → `tryReferralActiveBonus` → статус `ACTIVE`, +40 баллов рефереру.

Один приглашённый — одна запись `Referral` (`referredUserId` unique).

---

## 7. Списание

`POST /api/bonuses/spend` body: `{ listingId, offer: "BUMP_1D" | "HIGHLIGHT_3D" }`.

| Offer | Баллы | Эффект |
|-------|------|--------|
| `BUMP_1D` | 70 | `promotedUntil` +1 день, `isPromoted=true` |
| `HIGHLIGHT_3D` | 120 | `highlightedUntil` +3 дня |

Условия: своё ACTIVE объявление, quality, достаточный баланс, не `bonusBlocked`.

`referenceKey` списания: `spend:{offer}:{listingId}:{YYYY-MM-DD}` — одно списание того же типа на объявление **в день**.

---

## 8. Защита от накрутки

- Уникальный индекс `(userId, reason, referenceKey)` — повторное начисление → `DUPLICATE`.
- `bonusBlocked` на пользователе — все earn/spend отклоняются.
- `isBanned` — то же.
- Статусы транзакции: `PENDING` → ручное `approve` в админке; `REJECTED`; `REVERSED` через `reverseBonusTransaction`.
- Админ: `/admin/bonuses` — список, adjust, block.

---

## 9. Связь с честной выдачей

Продвижение за баллы **только** выставляет `promotedUntil` / `highlightedUntil` — те же поля, что и за рубли.

Ранжирование: `calculate-listing-score`, cap **28%** promoted на странице, mix **30%** — см. `src/lib/listings/scoring/`. Баллы **не дают** отдельного «супер-буста» в формуле.

---

## 10. Админка

- `GET /api/admin/bonuses` — фильтры userId, status, reason.
- `POST` adjust: `{ userId, amount, note? }` — положительное через `awardBonus`, отрицательное через `spendBonus`.
- `PATCH` block: `{ userId, blocked: boolean }`.

UI: `/admin/bonuses`.

---

## 11. Пользовательский UI (публичный минимум)

- `/profile/bonuses` — баланс, как заработать, история, реферальная ссылка.
- `/profile/promotion` — рубли + баллы (два способа продвижения).
- `ListingShareButtons` — шаринг с начислением.

**Не показывать** на сайте: полную таблицу reason, лимиты 80/250, внутренние referenceKey.

---

## 12. Деплой и проверка

```bash
npx prisma migrate deploy
npx prisma generate
```

Чеклист:

1. Новый пользователь → +5 WELCOME после регистрации.
2. Подтверждение телефона → +15 (если хук вызван).
3. Объявление 3+ фото → +35 first + до +8 quality.
4. Шаринг → +8, повтор в ту же неделю → отказ.
5. Списание 70 → `promotedUntil` обновился, баланс уменьшился.
6. Админ adjust + block.

---

## 13. Связанные документы

- [MONETIZATION_AND_WALLET.md](./MONETIZATION_AND_WALLET.md) — рубли, T-Bank, платное продвижение, реклама
- [DEPLOY_CHECKLIST.md](./DEPLOY_CHECKLIST.md) — выкладка на production
