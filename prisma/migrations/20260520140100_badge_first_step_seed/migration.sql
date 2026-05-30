INSERT INTO "Badge" ("id", "code", "title", "subtitle", "description", "icon", "priority", "isActive", "updatedAt")
VALUES (
  'badge_first_step',
  'FIRST_STEP',
  'Первый шаг',
  'Профиль заполнен',
  'Пользователь зарегистрировался на Нашло и полностью заполнил профиль.',
  '/badges/pervii.svg',
  5,
  true,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("code") DO UPDATE SET
  "title" = EXCLUDED."title",
  "subtitle" = EXCLUDED."subtitle",
  "description" = EXCLUDED."description",
  "icon" = EXCLUDED."icon",
  "priority" = EXCLUDED."priority",
  "isActive" = true,
  "updatedAt" = CURRENT_TIMESTAMP;
