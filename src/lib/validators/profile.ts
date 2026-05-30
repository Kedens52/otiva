import { z } from "zod"
import {
  normalizeHttpUrl,
  stripHtml,
  validateProfileForm,
} from "@/lib/profile/validation"
import { DELIVERY_OPTIONS, EXPERIENCE_OPTIONS, SELLER_ROLE_OPTIONS } from "@/lib/profile/constants"

const avatarSchema = z
  .string()
  .max(500)
  .refine(
    (value) => value === "" || value.startsWith("/") || /^https?:\/\//.test(value),
    "Некорректная ссылка на фото",
  )
  .optional()

const optionalUrl = z
  .string()
  .max(500)
  .optional()
  .or(z.literal(""))
  .transform((v) => (v ? normalizeHttpUrl(v) : ""))

const cleanText = (max: number) =>
  z
    .string()
    .max(max)
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? stripHtml(v) : ""))

export const updateProfileSchema = z
  .object({
    name: cleanText(80),
    firstName: cleanText(50),
    lastName: cleanText(50),
    profileHeadline: cleanText(80),
    description: cleanText(500),
    region: cleanText(80),
    city: cleanText(80),
    district: cleanText(80),
    metro: cleanText(60),
    addressNote: cleanText(120),
    avatar: avatarSchema,
    profileType: z.enum(["PERSON", "COMPANY"]).optional(),
    sellerRole: z
      .enum(SELLER_ROLE_OPTIONS.map((o) => o.value) as [string, ...string[]])
      .optional()
      .or(z.literal("")),
    companyName: cleanText(120),
    businessCategory: cleanText(80),
    companyInn: z
      .string()
      .optional()
      .or(z.literal(""))
      .transform((v) => (v ? v.replace(/\D/g, "") : "")),
    companyWebsite: optionalUrl,
    companyRole: cleanText(80),
    experience: z
      .enum(EXPERIENCE_OPTIONS.map((o) => o.value) as [string, ...string[]])
      .optional()
      .or(z.literal("")),
    serviceArea: cleanText(120),
    deliveryOptions: z
      .array(z.enum(DELIVERY_OPTIONS.map((o) => o.value) as [string, ...string[]]))
      .max(5)
      .optional(),
    guaranteeText: cleanText(300),
    websiteUrl: optionalUrl,
    vkUrl: optionalUrl,
    maxUrl: optionalUrl,
    showPhone: z.boolean().optional(),
    showPhonePublicly: z.boolean().optional(),
    showEmailPublicly: z.boolean().optional(),
    showCityPublicly: z.boolean().optional(),
    showDistrictPublicly: z.boolean().optional(),
    showActivityPublicly: z.boolean().optional(),
    showBadgesPublicly: z.boolean().optional(),
    showReviewsPublicly: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    const errors = validateProfileForm({
      name: data.name,
      firstName: data.firstName,
      lastName: data.lastName,
      profileHeadline: data.profileHeadline,
      description: data.description,
      region: data.region,
      city: data.city,
      district: data.district,
      metro: data.metro,
      addressNote: data.addressNote,
      profileType: data.profileType,
      sellerRole: data.sellerRole,
      companyName: data.companyName,
      businessCategory: data.businessCategory,
      companyInn: data.companyInn,
      companyWebsite: data.companyWebsite,
      companyRole: data.companyRole,
      experience: data.experience,
      serviceArea: data.serviceArea,
      guaranteeText: data.guaranteeText,
      vkUrl: data.vkUrl,
      maxUrl: data.maxUrl,
      websiteUrl: data.websiteUrl,
    })
    for (const [key, message] of Object.entries(errors)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message, path: [key] })
    }
  })

export const emailSchema = z.object({
  email: z.string().email("Некорректный email"),
})

export const emailVerifySchema = z.object({
  email: z.string().email(),
  code: z.string().length(6, "Код — 6 цифр"),
})

export const notificationsSchema = z.object({
  newMessage: z.boolean().optional(),
  listingApproved: z.boolean().optional(),
  listingRejected: z.boolean().optional(),
  newReview: z.boolean().optional(),
  promotionExpiring: z.boolean().optional(),
  wantToBuyNewOffer: z.boolean().optional(),
  wantToBuyOfferStatus: z.boolean().optional(),
  wantToBuyExpiring: z.boolean().optional(),
  wantToBuyRejected: z.boolean().optional(),
})
