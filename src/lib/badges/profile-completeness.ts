export type ProfileCompletenessInput = {
  name?: string | null
  phone?: string | null
  phoneVerifiedAt?: Date | string | null
  email?: string | null
  emailVerified?: boolean | null
  avatar?: string | null
  city?: string | null
  description?: string | null
}

export type ProfileCompletenessField = {
  key: string
  label: string
  done: boolean
}

export type ProfileCompleteness = {
  score: number
  fields: ProfileCompletenessField[]
  isComplete: boolean
}

function filled(value?: string | null) {
  return Boolean(value?.trim())
}

/**
 * Обязательные поля профиля для значка «Первый шаг» (все 6 = 100%).
 */
export function calculateProfileCompleteness(
  input: ProfileCompletenessInput,
): ProfileCompleteness {
  const fields: ProfileCompletenessField[] = [
    { key: "name", label: "Имя", done: filled(input.name) && (input.name?.trim().length ?? 0) >= 2 },
    {
      key: "phone",
      label: "Телефон подтверждён",
      done: filled(input.phone) && Boolean(input.phoneVerifiedAt),
    },
    {
      key: "email",
      label: "Почта подтверждена",
      done: filled(input.email) && Boolean(input.emailVerified),
    },
    { key: "avatar", label: "Фото профиля", done: filled(input.avatar) },
    { key: "city", label: "Город", done: filled(input.city) },
    { key: "description", label: "Описание", done: filled(input.description) },
  ]

  const doneCount = fields.filter((f) => f.done).length
  const score = Math.round((doneCount / fields.length) * 100)

  return {
    score,
    fields,
    isComplete: score === 100,
  }
}
