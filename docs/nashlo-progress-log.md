# Nashlo — Progress Log

## 2026-05-09 — Major feature batch (sessions 1–3)

### Tasks completed

#### 1. Fix video deletion on listing edit
- **File:** `src/app/my-listings/[id]/edit/page.tsx`
- **Fix:** `video: video || undefined` → `video: video || null`
- `undefined` is stripped by `JSON.stringify`; `null` is sent and correctly clears the DB field.

#### 2. Fix admin approve/reject buttons (CSRF 403)
- **Files:** `src/app/admin/listings/page.tsx`, `src/app/admin/moderation/page.tsx`
- **Fix:** Added `getCsrf()` helper that reads the `nashlo_admin_csrf` cookie, and attached `X-CSRF-Token` header on every admin `fetch` POST.
- **Root cause:** `withAdminApi` guard always verifies CSRF on non-GET, but the client pages were not sending the token.

#### 3. Rejection reason modal
- **File:** `src/app/admin/listings/page.tsx`
- Added `RejectModal` component with 6 quick-select chips + free textarea (max 500 chars).
- "Отклонить" button now opens the modal instead of calling the API directly.
- **API:** `src/app/api/admin/listings/route.ts` — saves `rejectionReason` to DB when action=REJECTED, clears it when APPROVED.
- `rejectionReason` is displayed in listing row in the admin table.

#### 4. Auto-moderation on listing create
- **Files:** `src/lib/listing-moderation.ts`, `src/app/api/listings/route.ts`
- Pattern-based verdict:
  - Hard-block patterns (drugs, weapons, escort, fake docs) → REJECTED immediately
  - Review flags (phone in text, external links, email, caps spam) → MODERATION
  - Clean listing → ACTIVE (`autoApproved: true`)
- Also checks `user.isBanned` → REJECTED.

#### 5. Full user detail page in admin
- **Files:**
  - `src/app/admin/users/[id]/page.tsx` (NEW)
  - `src/app/api/admin/users/[id]/route.ts` (NEW)
- Shows: profile card, listings (with views/rejectionReason), sessions/devices, payments, wallet transactions, reports, moderation history.
- Actions: Ban/Unban, Verify/Unverify — all with CSRF.
- Seller name in listings table links to `/admin/users/[seller.id]`.

#### 6. Schema additions (prisma db push)
- **File:** `prisma/schema.prisma`
- Added to `Listing`: `uniqueViews Int @default(0)`, `rejectionReason String?`, `autoApproved Boolean @default(false)`, `listingViews ListingView[]`, `reviews Review[]`
- Added to `User`: `positiveReviewsCount Int @default(0)`, `negativeReviewsCount Int @default(0)`
- New model `ListingView` — unique fingerprint tracking per listing.
- `Review` model rewritten: `sellerId` → `targetUserId`; added `listingId`, `conversationId`, `isHidden`, `isDeleted`, `updatedAt`; unique constraint `[authorId, targetUserId, listingId]`.
- **⚠️ Data loss warning:** `Review` table was dropped and recreated. Existing reviews lost. Use `migrate dev` + data migration script if review data must be preserved in future.

#### 7. Unique views tracking
- **File:** `src/app/api/listings/[id]/route.ts`
- `viewFingerprint(req)` = sha256(IP + UserAgent).slice(0, 16)
- `listingView.upsert` with DO NOTHING semantics on conflict — each fingerprint counted once per listing.
- `uniqueViews` incremented only on new fingerprint.

#### 8. Recommendations algorithm on homepage
- **File:** `src/app/page.tsx`
- Scoring: `promoted(+100) + recency(0–60) + sellerRating×8 + uniqueViews×0.2(max 20)`
- Promoted and organic listings interleaved (1 promoted per 3 positions).
- Deterministic daily shuffle via date-based seed — same order all day, rotates at midnight.
- "Свежие объявления" block remains as pure chronological.

#### 9. Review & rating system (backend only)
- **Files:**
  - `src/lib/reviews/user-reviews.ts` (NEW)
  - `src/app/api/reviews/route.ts` (POST — create review)
  - `src/app/api/reviews/[id]/route.ts` (GET / PATCH / DELETE)
  - `src/app/api/users/[id]/reviews/route.ts` (GET stats + list)
  - `src/app/api/admin/reviews/[id]/hide/route.ts` (POST — admin hide)
  - `src/app/api/admin/reviews/[id]/restore/route.ts` (POST — admin restore)
- Eligibility: no self-review, no duplicate per listing, real conversation with messages from BOTH sides required.
- Rating recalculation: avg of non-deleted non-hidden reviews, rounded to 1 decimal.
- `positiveReviewsCount` (rating ≥ 4) and `negativeReviewsCount` (rating ≤ 2) tracked on User.
- Profile page (`/api/profile/[id]`) returns reviews filtered `isDeleted: false, isHidden: false`.

### Must not break next time
- `/admin/listings` and `/admin/moderation` require `X-CSRF-Token` header on all POSTs.
- `ListingView` model deduplicates by `[listingId, fingerprint]` unique constraint.
- `Review` unique constraint is `[authorId, targetUserId, listingId]`.
- `withAdminApi` guard always validates CSRF on non-GET.
- Video field: always send `null` (not `undefined`) to clear.

### TODO / next steps
- [ ] UI for reviews — seller profile page showing reviews list + rating bar
- [ ] Admin reviews management page (`/admin/reviews`)
- [ ] Notify user on listing approve/reject (push notification)
- [ ] Review UI accessible from conversation/listing page
- [ ] Prisma migration with proper history (currently using `db push --accept-data-loss`)
- [ ] Replace in-memory rate-limit Maps with Redis for multi-instance production


---

## Session 3 — 2026-05-09

### Tasks completed

#### 10. Admin security fixes — CSRF and RBAC
- **Files changed:**
  - `src/app/api/admin/reviews/[id]/hide/route.ts` — rewritten to use `withAdminApi("listings.moderate")`; was using raw `getAdminSession()` with no CSRF/RBAC
  - `src/app/api/admin/reviews/[id]/restore/route.ts` — same fix as hide; sets `isHidden: false`
  - `src/app/api/admin/analytics/route.ts` — added missing `hasAdminPermission(ctx.staff, "dashboard.view")` check
  - `src/app/api/admin/business/route.ts` — POST was missing `validateCsrf(req)`; added CSRF + proper `AdminForbiddenError` import; replaced `adminDb as any` with direct `prisma.businessClient`

#### 11. Dynamic listing breadcrumbs
- **Files created:**
  - `src/lib/categories/listing-breadcrumbs.ts` — `getListingBreadcrumbs()` builds `[Главная, Category, Subcategory?, Title]` using real listing data; subcategory label resolved from `CATEGORY_FILTERS` options; category link → `/search?cat=[slug]`, subcategory link → `/search?cat=[slug]&subcategory=[value]`
  - `src/lib/seo/jsonld.ts` — `buildBreadcrumbJsonLd()` produces Schema.org BreadcrumbList JSON-LD; `SITE_URL` from `NEXT_PUBLIC_SITE_URL` env or fallback to `https://nashlo.ru`
  - `src/components/listings/ListingBreadcrumbs.tsx` — visual breadcrumb bar with `›` separator; middle items hidden on mobile (`hidden sm:flex`); last item truncated (`max-w-[200px] sm:max-w-[360px] md:max-w-none`); aria-current="page" on last item
- **Files modified:**
  - `src/components/layout/Breadcrumbs.tsx` — added `pathname.startsWith("/listings/")` to suppression list so generic breadcrumbs don't overlap with rich ones; also fixed encoding corruption in this file
  - `src/app/listings/[id]/page.tsx` — imports for the 3 new modules; breadcrumb computation after `isOwn`; return wrapped in `<>` fragment with `<ListingBreadcrumbs>` + JSON-LD `<script>` before `<main>`

### Must not break next time
- `Breadcrumbs.tsx` suppresses `/listings/*` — listing pages have their own breadcrumbs
- `getListingBreadcrumbs` falls back gracefully when category is null (shows "Объявления" → /search)
- `buildBreadcrumbJsonLd` uses `NEXT_PUBLIC_SITE_URL` env — must be set in production `.env`
- All review-related TS errors (24) are stale Prisma client — resolved by `npx prisma generate` on deploy

### TODO / next steps
- [ ] Deploy: `cd Q:\OTIVA && .\deploy.ps1` — runs prisma generate + db push + build + pm2 restart
- [ ] UI for reviews — seller profile page showing reviews list + rating bar
- [ ] Admin reviews management page (`/admin/reviews`)
- [ ] Notify user on listing approve/reject
- [ ] Review UI accessible from conversation/listing page
