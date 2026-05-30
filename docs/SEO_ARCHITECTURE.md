# SEO-архитектура Nashlo

Цель: масштабируемая индексация (категории, города, подкатегории, объявления, продавцы) без спам-страниц.

## Что уже работает

| Слой | Реализация |
|------|------------|
| Метаданные | `src/lib/seo/site.ts` — title, description, canonical, OpenGraph, Twitter, robots |
| Категории | `/category/{cat}`, `/category/{cat}/{child}`, `/category/{cat}/{city}`, `/category/{cat}/{child}/{city}` |
| Редиректы | `next.config.mjs` — `/transport` → `/category/transport` и т.д. |
| Объявления | `generateListingMetadata`, JSON-LD ClassifiedAd + Product/Service/Job/RealEstate |
| Продавцы | `/seller/{slug}` (канон), JSON-LD ProfilePage |
| Sitemap | Индекс `sitemap.xml` → static, categories, cities, listings, sellers, business |
| Noindex | login, profile hub, chat, favorites, create, search, admin |
| Фильтры | `filter-indexing.ts` — whitelist; остальное noindex + canonical на категорию |
| Перелинковка | `SeoCategoryFooter` — города, похожие категории, лендинги `/s/` |

## Индексируемые URL

- `/` — главная
- `/category/*` — категории, подкатегории, города (≥5 объявлений в городе)
- `/category/{cat}/{child}/{city}` — подкатегория + город (порог тот же)
- `/listings/{slug-id}` — только `ACTIVE`
- `/seller/{slug}` — продавец с активными объявлениями
- `/s/{landing}` — SEO-лендинги из каталога / БД

## Закрыто от индекса

- `/profile` (кабинет), `/profile/settings`, `/profile/finance`, …
- `/login`, `/register`, `/create`, `/chat`, `/messages`, `/favorites`
- `/search` (+ query в robots)
- `/admin`, `/api`
- Фильтрованные URL с лишними параметрами → `noindex`, canonical на чистую категорию

Публичный `/profile/{id}`: метаданные и JSON-LD есть, канонический URL — `/seller/{slug}` (sitemap ведёт на seller).

## Structured Data (schema.org)

| Тип | Где |
|-----|-----|
| Organization, WebSite, SearchAction | Главная (`HomeJsonLd`) |
| CollectionPage, BreadcrumbList | Категории |
| ClassifiedAd, Offer, WebPage, BreadcrumbList | Объявления |
| Product / Service / JobPosting | По типу категории |
| RealEstateListing | Недвижимость |
| ProfilePage, Person | Продавец |

## Sitemap

После деплоя проверьте:

- https://nashlo.ru/robots.txt — `Host: nashlo.ru`, все `Sitemap:` без localhost
- https://nashlo.ru/sitemap.xml — **индекс** (sitemapindex), не дублирует URL из дочерних файлов
- https://nashlo.ru/sitemap-static.xml — главная, legal, инфо
- https://nashlo.ru/sitemap-categories.xml — категории и `/s/` лендинги
- https://nashlo.ru/sitemap-cities.xml — `/category/{cat}/{city}` (≥5 объявлений)
- https://nashlo.ru/sitemap-category-city.xml — `/category/{cat}/{child}/{city}`
- Пустые дочерние sitemap не попадают в индекс и отдают 404 (Google не принимает urlset без `<url>`)
- https://nashlo.ru/sitemap-listings.xml — активные объявления
- https://nashlo.ru/sitemap-want-to-buy.xml — активные заявки «Куплю»
- https://nashlo.ru/sitemap-sellers.xml — продавцы
- https://nashlo.ru/sitemap-business.xml — B2B (компании, B2B-объявления, разделы)

В sitemap только канонические `/category/...` (без дублей `/transport`).

`npm run sync:robots` обновляет `public/robots.txt` из `src/lib/seo/robots-disallow.ts` (перед build).

## Деплой и индексация

1. Успешный `npm run build` на сервере (нужна рабочая БД для prerender категорий).
2. `node scripts/verify-next-build.js`
3. Отправить sitemap в Яндекс.Вебмастер и Google Search Console.
4. Не индексировать страницы с `?priceMin=` и др. — уже noindex.

## hreflang

Один язык (ru-RU) — hreflang не требуется.

## Дальнейший рост (без спама)

- Районы: только при ≥N объявлениях в районе (аналог города).
- Бренд/модель (`?brand=bmw`): расширять `INDEXABLE_BRAND_VALUES` точечно.
- Лендинги `/s/`: добавлять через админку/скрипт с уникальным текстом.

## Файлы

- `src/lib/seo/` — ядро
- `src/app/sitemap.xml/route.ts` — индекс карт
- `src/app/sitemap-*.xml/route.ts` — дочерние карты
- `src/lib/seo/robots-disallow.ts` — единый список Disallow и путей sitemap
- `src/app/robots.ts` + `src/lib/seo/robots-txt.ts` — robots.txt (Host: домен без схемы)
- `public/robots.txt` — копия для nginx/static; при изменении правил обновлять вместе с `robots-txt.ts`
- `src/middleware.ts` — rewrite `/robots.txt/` → `/robots.txt` без 308
- `src/lib/seo/filter-indexing.ts` — политика фильтров
