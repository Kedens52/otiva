import { z } from "zod"

export const wantToBuyConditionSchema = z.enum(["NEW", "USED", "ANY"])

export const createWantToBuySchema = z.object({
  title: z.string().trim().min(3).max(100),
  description: z.string().trim().max(3000).default(""),
  categorySlug: z.string().trim().min(1).max(64),
  priceMax: z.number().int().min(0).max(1_000_000_000).optional().nullable(),
  city: z.string().trim().max(100).optional().nullable(),
  condition: wantToBuyConditionSchema.default("ANY"),
})

export const patchWantToBuySchema = z
  .object({
    title: z.string().trim().min(3).max(100).optional(),
    description: z.string().trim().max(3000).optional(),
    priceMax: z.number().int().min(0).max(1_000_000_000).nullable().optional(),
    city: z.string().trim().max(100).nullable().optional(),
    condition: wantToBuyConditionSchema.optional(),
    close: z.literal(true).optional(),
    renew: z.literal(true).optional(),
  })
  .refine(
    (data) => {
      const actionCount = [data.close, data.renew].filter(Boolean).length
      return actionCount <= 1
    },
    { message: "Укажите только одно действие: close или renew" },
  )

export const wantToBuyFeedSortSchema = z.enum([
  "newest",
  "offers",
  "no_offers",
  "price",
  "expires",
])

export const createOfferSchema = z.object({
  message: z.string().trim().min(10).max(2000),
  price: z.number().int().min(0).max(1_000_000_000),
  listingId: z.string().trim().max(64).optional().nullable(),
  listingPath: z.string().trim().max(500).optional().nullable(),
})

export const patchOfferSchema = z.object({
  action: z.enum(["accept", "decline", "viewed"]),
})
