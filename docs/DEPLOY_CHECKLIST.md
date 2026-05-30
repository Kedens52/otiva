# Nashlo Deploy Checklist

## 1. Before upload

Run locally:

```bash
npm run lint
npm run build
```

If `npm run build` fails on Windows because Prisma cannot replace `query_engine-windows.dll.node`, verify the app build separately:

```bash
npx prisma generate
npx next build
```

## 2. Upload to server

Upload the new release archive or use:

```bash
bash deploy.sh
```

or on Windows:

```powershell
.\deploy.ps1
```

## 3. Сайт без стилей (404 на `/_next/static/chunks/*.js`)

HTML отдаётся, но CSS/JS — **404**. Обычно сборка на сервере не завершилась, а старый `.next` уже удалён.

**На сервере:**

```bash
cd /root/OTIVA
bash scripts/recover-production-build.sh
```

Или вручную: `npx prisma migrate deploy` → `npm run build` → `node scripts/verify-next-build.js` → `pm2 restart otiva --update-env`.

После восстановления обновите страницу **Ctrl+Shift+R** (сброс кэша).

## 4. Server commands

On the server run:

```bash
cd /root/OTIVA   # обязательно: не из ~ (/root)
npm install
npm run check:site-url:prod
npx prisma generate
npx prisma migrate deploy
npm run build
pm2 restart otiva --update-env
```

If the PM2 process does not exist yet:

```bash
pm2 start npm --name otiva -- start
pm2 save
```

Optional checks:

```bash
pm2 list
pm2 logs otiva
```

## 5. Verify public production endpoints

Run:

```bash
curl -I https://nashlo.ru
curl -I https://nashlo.ru/robots.txt
curl -I https://nashlo.ru/robots.txt/
curl -I http://nashlo.ru/robots.txt
curl -I https://nashlo.ru/sitemap.xml
curl -I https://nashlo.ru/yandex_6eb4b0158e7865c6.html
```

Expected:

- `https://nashlo.ru` returns `200`
- `robots.txt` returns `200` without redirect (`content-type: text/plain`)
- `robots.txt/` (trailing slash) returns `200`, not `308` — иначе Яндекс.Вебмастер пишет «редирект на /robots.txt»
- `http://nashlo.ru/robots.txt` may `301` → `https://nashlo.ru/robots.txt` (OK)
- body contains `Host: nashlo.ru` (без `https://`)
- `sitemap.xml` returns `200` without redirect (sitemap **index**)
- `sitemap-business.xml` returns `200` (discovered via index, not listed in robots)
- `robots.txt` contains only `Sitemap: https://nashlo.ru/sitemap.xml` and `Host: nashlo.ru`
- `yandex_6eb4b0158e7865c6.html` returns `200` without redirect

## 5. Run production SEO check

After deploy run:

```bash
npm run sync:robots
npm run check:seo:prod
```

This verifies:

- main page is reachable
- `robots.txt` is reachable and contains `Sitemap:`
- `sitemap.xml` is reachable and contains `nashlo.ru`
- Yandex verification file is reachable
- main page contains `Нашло`
- main page does not contain `Отива` / `Otiva`

## 6. Yandex Webmaster

1. Add `https://nashlo.ru/` to Yandex Webmaster.
2. Confirm that the file opens:
   - `https://nashlo.ru/yandex_6eb4b0158e7865c6.html`
3. Add sitemap:
   - `https://nashlo.ru/sitemap.xml`
4. Request recrawl for the home page.

## 7. Google Search Console

Preferred verification via HTML file:

1. Add property `https://nashlo.ru/`.
2. Choose verification by HTML file.
3. Download the Google verification file.
4. Place it into `public/` without renaming it.
5. Deploy the file.
6. Check that `https://nashlo.ru/googleXXXXXXXXXXXX.html` opens.
7. Click "Verify" in Google Search Console.

Fallback verification via meta tag:

- Add the received token to `GOOGLE_SITE_VERIFICATION` on the server.

After verification:

1. Submit sitemap:
   - `https://nashlo.ru/sitemap.xml`
2. Use URL Inspection for:
   - `https://nashlo.ru/`
   - `https://nashlo.ru/robots.txt`
   - `https://nashlo.ru/sitemap.xml`
   - one category URL
   - one listing URL
   - one legal page URL

## 8. Production env required on server

`npm run check:site-url:prod` requires **at least one** of these to equal `https://nashlo.ru` (unset keys are ignored; any set key must not be localhost and must match exactly):

- `APP_URL`
- `SITE_URL`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SITE_URL`

Recommended: set all four to the same value so server and client code always resolve the same origin.

Core secrets and DB:

```env
DATABASE_URL=
JWT_SECRET=
NEXT_PUBLIC_YANDEX_MAPS_API_KEY=
```

Example (minimal URL block — one key is enough for the check):

```env
SITE_URL=https://nashlo.ru
```

Example (recommended — full URL block):

```env
APP_URL=https://nashlo.ru
SITE_URL=https://nashlo.ru
NEXT_PUBLIC_APP_URL=https://nashlo.ru
NEXT_PUBLIC_SITE_URL=https://nashlo.ru
```

Recommended extras:

```env
NEXT_PUBLIC_BASE_URL=https://nashlo.ru
YANDEX_VERIFICATION=6eb4b0158e7865c6
INDEXNOW_KEY=nashlo_indexnow_2026_8f3a9c7b2d6e4f1a9b0c5d8e7a2f6c3
```

Файл проверки: `https://nashlo.ru/nashlo_indexnow_2026_8f3a9c7b2d6e4f1a9b0c5d8e7a2f6c3.txt` (создаётся при `npm run build`, если ключ в `.env` / `.env.local`).

### Yandex OAuth (production)

Кабинет: Redirect URI `https://nashlo.ru/api/auth/yandex/callback`, Suggest Hostname `https://nashlo.ru`.

На сервере в `/root/OTIVA/.env`:

```
YANDEX_CLIENT_ID=9f0ea463eae349df8d23323f494ce4bb
YANDEX_CLIENT_SECRET=<из кабинета oauth.yandex.ru>
YANDEX_REDIRECT_URI=https://nashlo.ru/api/auth/yandex/callback
SITE_URL=https://nashlo.ru
NEXT_PUBLIC_SITE_URL=https://nashlo.ru
```

**Автоматически при деплое (рекомендуется):**

1. Один раз: `deploy/oauth.production.env` уже есть локально (из `.example`, секреты не в git).
2. С Windows: `.\deploy.ps1` — файл заливается на сервер и сливается в `.env` перед build.

**Вручную на сервере:** `bash scripts/apply-production-oauth-env.sh` или `./setup-oauth-production.sh 'vk_secret'`
Проверка: `npm run check:auth:prod`.

### VK ID (production)

Кабинет https://id.vk.com — приложение `54574778`:

- Redirect URI: `https://nashlo.ru/api/auth/vk/callback`
- `VK_CLIENT_ID=54574778`, `NEXT_PUBLIC_VK_APP_ID=54574778`
- `VK_CLIENT_SECRET` — защищённый ключ из кабинета (обязателен для `/api/auth/vk/exchange`)
GOOGLE_SITE_VERIFICATION=
```

## 4. P3009: failed migration `20260520140000_badge_first_step`

If `prisma migrate deploy` stops with **P3009**, the DB has a failed row in `_prisma_migrations`.

On the server (`/root/OTIVA`):

```bash
node scripts/recover-failed-migrations.js
npx prisma migrate deploy
```

Or manually:

```bash
echo 'ALTER TYPE "BadgeCode" ADD VALUE IF NOT EXISTS '\''FIRST_STEP'\'';' | npx prisma db execute --stdin
npx prisma migrate resolve --applied "20260520140000_badge_first_step"
npx prisma migrate deploy
```

If `--applied` fails, try `--rolled-back` and run `migrate deploy` again (it will re-apply the fixed migration).

`deploy.ps1` / `deploy.sh` now run the recovery script automatically before `migrate deploy`.

## 5. Значки (иконки в профиле и админке)

Папка **`public/badges/`** должна быть в репозитории и на сервере. Без неё картинки значков дают 404 (битая иконка в админке и на сайте).

Перед деплоем локально:

```bash
git add public/badges/
```

На сервере после `migrate deploy`:

```bash
cd /root/OTIVA   # обязательно: не из ~ (/root)
node scripts/ensure-badge-catalog.js
# или: npm run db:badges
```

**На сервере нет git** — `git add` / `deploy.ps1` выполняйте только на **Windows-ПК** с репозиторием, затем `.\deploy.ps1` зальёт архив на сервер.

Если значки уже на сервере, но картинок нет — скопируйте папку с ПК:

```powershell
scp -r "Q:\Новая папка\OTIVA\public\badges" root@185.154.193.6:/root/OTIVA/public/
```

Проверка после деплоя с API-раздачей:

```bash
curl -I https://nashlo.ru/api/badges/verified.png
```

Ответ **200** и `Content-Type: image/png`.

Если `/badges/*.png` даёт 404 от Next.js, а файлы на диске есть — иконки в UI идут через `/api/badges/…` (см. `resolveBadgeIcon`). Либо добавьте в nginx:

```nginx
location ^~ /badges/ {
    alias /root/OTIVA/public/badges/;
}
```

### robots.txt: trailing slash без 308

Симптом: `/robots.txt` → **200** (nginx/static), `/robots.txt/` → **308** (запрос уходит в Next.js).

**Вариант A (nginx, сразу на сервере):** скопировать блок из `deploy/nginx-seo-static.conf` в vhost **перед** `location /`. Проверить, что блок реально в файле:

```bash
grep -n "robots.txt" /etc/nginx/sites-enabled/*
nano /etc/nginx/sites-enabled/nashlo   # или имя вашего vhost
nginx -t && systemctl reload nginx
curl -I https://nashlo.ru/robots.txt/
```

**Вариант B (код):** в `next.config.mjs` есть `rewrites` для `/robots.txt/` → нужны `npm run build` и `pm2 restart otiva`.

### Cron: пересчёт значков пользователей

```bash
grep CRON_SECRET /root/OTIVA/.env
curl -sS -X POST https://nashlo.ru/api/cron/sync-badges \
  -H "Authorization: Bearer ВАШ_CRON_SECRET"
```

### Cron: «Куплю» (истечение и напоминания)

Раз в сутки (или каждые 6 часов): переводит просроченные заявки в `EXPIRED` и шлёт напоминание за 3 дня до `expiresAt`.

```bash
curl -sS -X POST https://nashlo.ru/api/cron/want-to-buy-reminders \
  -H "Authorization: Bearer ВАШ_CRON_SECRET"
```

Пример crontab на сервере:

```cron
0 3 * * * curl -sS -X POST https://nashlo.ru/api/cron/want-to-buy-reminders -H "Authorization: Bearer $(grep ^CRON_SECRET= /root/OTIVA/.env | cut -d= -f2-)" >/dev/null
```

Без заголовка `Authorization: Bearer …` будет `{"error":"Unauthorized"}`.

Notes:

- do not use `migrate dev` on production
- server `.env.local` overrides `.env.production` during Next.js build/start
- do not leave `localhost` in any production `.env*` file
- `npm run check:site-url:prod` must pass before `npm run build`
- do not deploy over the old tree without cleanup
- keep `.env*`, `public/uploads`, `node_modules`, and `prisma/migrations`

## 7. UX: два сценария («Объявления» / «Куплю») после выкладки

Проверить вручную (mobile 375px + desktop):

| URL | Что проверить |
|-----|----------------|
| `/` | Категории → лента; город — только в шапке; переключатель «Куплю» |
| `/kyplu` | «Покупки наоборот», лента заявок, категории |
| `/search?q=test` | Пустая выдача → CTA «Создать заявку» |
| `/categories` | Плашка → заявки «Куплю» |
| `/kyplu/categories` | Плашка → каталог объявлений |
| `/profile` | Секции «Продаю» / «Куплю», блок заявок на desktop |
| Каталог в шапке (desktop) | На `/kyplu` — категории заявок; на `/` — объявления |

Переключатель режима: поиск sell → `/search`, want → `/kyplu/search`.

Кнопка «Разместить»: **Продать** / **Купить** (или «Создать заявку» в режиме Куплю).

SEO (view-source): title/description главной и `/kyplu` упоминают оба сценария.
