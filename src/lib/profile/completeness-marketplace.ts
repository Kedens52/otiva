import type { ProfileCompletenessField } from "@/lib/badges/profile-completeness"

export type MarketplaceProfileInput = {
  name?: string | null
  avatar?: string | null
  city?: string | null
  description?: string | null
  phone?: string | null
  phoneVerifiedAt?: Date | string | null
  profileType?: string | null
  sellerRole?: string | null
  companyName?: string | null
  activeListingsCount?: number
}

export type MarketplaceCompleteness = {
  score: number
  fields: ProfileCompletenessField[]
  hints: string[]
}

const WEIGHTS: { key: string; label: string; weight: number; hint: string; done: (u: MarketplaceProfileInput) => boolean }[] = [
  {
    key: "displayName",
    label: "Имя для отображения",
    weight: 10,
    hint: "Добавьте имя для отображения",
    done: (u) => Boolean(u.name?.trim() && u.name.trim().length >= 2),
  },
  {
    key: "avatar",
    label: "Аватар",
    weight: 10,
    hint: "Добавьте аватар",
    done: (u) => Boolean(u.avatar?.trim()),
  },
  {
    key: "city",
    label: "Город",
    weight: 10,
    hint: "Укажите город",
    done: (u) => Boolean(u.city?.trim() && u.city.trim().length >= 2),
  },
  {
    key: "bio",
    label: "О себе",
    weight: 15,
    hint: "Добавьте описание о себе",
    done: (u) => Boolean(u.description?.trim() && u.description.trim().length >= 20),
  },
  {
    key: "phone",
    label: "Телефон подтверждён",
    weight: 20,
    hint: "Подтвердите телефон",
    done: (u) => Boolean(u.phone?.trim() && u.phoneVerifiedAt),
  },
  {
    key: "accountType",
    label: "Тип аккаунта",
    weight: 10,
    hint: "Выберите тип аккаунта",
    done: (u) => u.profileType === "PERSON" || u.profileType === "COMPANY",
  },
  {
    key: "roleOrCompany",
    label: "Роль или компания",
    weight: 10,
    hint: "Укажите роль продавца или название компании",
    done: (u) => {
      if (u.profileType === "COMPANY") return Boolean(u.companyName?.trim())
      return Boolean(u.sellerRole?.trim())
    },
  },
  {
    key: "firstListing",
    label: "Первое объявление",
    weight: 15,
    hint: "Разместите первое объявление",
    done: (u) => (u.activeListingsCount ?? 0) > 0,
  },
]

export function calculateMarketplaceProfileCompleteness(
  input: MarketplaceProfileInput,
): MarketplaceCompleteness {
  const fields: ProfileCompletenessField[] = WEIGHTS.map((w) => ({
    key: w.key,
    label: w.label,
    done: w.done(input),
  }))

  let score = 0
  for (const w of WEIGHTS) {
    if (w.done(input)) score += w.weight
  }

  const hints = WEIGHTS.filter((w) => !w.done(input)).map((w) => w.hint)

  return { score, fields, hints }
}
