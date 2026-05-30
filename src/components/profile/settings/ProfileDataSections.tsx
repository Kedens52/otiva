"use client"

import { NASHLO_CITIES_FOR_LISTING } from "@/lib/city-selection"
import {
  DELIVERY_OPTIONS,
  EXPERIENCE_OPTIONS,
  PROFILE_HEADLINE_EXAMPLES,
  SELLER_ROLE_OPTIONS,
} from "@/lib/profile/constants"
import type { MarketplaceCompleteness } from "@/lib/profile/completeness-marketplace"
import {
  ProfileTextField,
  ProfileTextareaField,
  PrivacySwitch,
} from "@/components/profile/settings/ProfileField"

export type ProfileSettingsForm = {
  id: string
  name: string
  firstName: string
  lastName: string
  phone: string
  email: string
  city: string
  region: string
  district: string
  metro: string
  addressNote: string
  description: string
  profileHeadline: string
  avatar: string
  profileType: "PERSON" | "COMPANY"
  sellerRole: string
  companyName: string
  companyInn: string
  companyWebsite: string
  companyRole: string
  businessCategory: string
  experience: string
  serviceArea: string
  deliveryOptions: string[]
  guaranteeText: string
  websiteUrl: string
  vkUrl: string
  maxUrl: string
  createdAt: string
  trustTier: string
  isVerified: boolean
  showPhone: boolean
  showPhonePublicly: boolean
  showEmailPublicly: boolean
  showCityPublicly: boolean
  showDistrictPublicly: boolean
  showActivityPublicly: boolean
  showBadgesPublicly: boolean
  showReviewsPublicly: boolean
}

type Props = {
  form: ProfileSettingsForm
  setForm: React.Dispatch<React.SetStateAction<ProfileSettingsForm | null>>
  fieldErrors: Record<string, string>
  completeness: MarketplaceCompleteness | null
  saving: boolean
  profileSuccess: boolean
  onSave: () => void
}

const cityListId = "profile-city-suggestions"

export function ProfileDataSections({
  form,
  setForm,
  fieldErrors,
  completeness,
  saving,
  profileSuccess,
  onSave,
}: Props) {
  const patch = (partial: Partial<ProfileSettingsForm>) =>
    setForm((c) => (c ? { ...c, ...partial } : c))

  const toggleDelivery = (value: string) => {
    setForm((c) => {
      if (!c) return c
      const has = c.deliveryOptions.includes(value)
      return {
        ...c,
        deliveryOptions: has
          ? c.deliveryOptions.filter((v) => v !== value)
          : [...c.deliveryOptions, value],
      }
    })
  }

  return (
    <>
      <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm sm:p-7">
        <h2 className="text-xl font-semibold text-zinc-950">Основные данные</h2>
        <p className="mt-1 text-sm text-zinc-500">Видны покупателям в объявлениях и в профиле продавца.</p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <ProfileTextField
            label="Имя для отображения"
            value={form.name}
            onChange={(v) => patch({ name: v })}
            error={fieldErrors.name}
            placeholder="Как вас зовут"
            maxLength={80}
          />
          <ProfileTextField
            label="Краткий статус профиля"
            value={form.profileHeadline}
            onChange={(v) => patch({ profileHeadline: v })}
            error={fieldErrors.profileHeadline}
            placeholder={PROFILE_HEADLINE_EXAMPLES[0]}
            hint="Например: частный мастер, магазин техники"
            maxLength={80}
          />
          <ProfileTextField
            label="Имя"
            value={form.firstName}
            onChange={(v) => patch({ firstName: v })}
            error={fieldErrors.firstName}
          />
          <ProfileTextField
            label="Фамилия"
            value={form.lastName}
            onChange={(v) => patch({ lastName: v })}
            error={fieldErrors.lastName}
          />
        </div>

        <div className="mt-4">
          <ProfileTextareaField
            label="О себе"
            value={form.description}
            onChange={(v) => patch({ description: v })}
            error={fieldErrors.description}
            placeholder="Расскажите, чем занимаетесь, что продаёте или какие услуги оказываете. Это увидят покупатели в вашем профиле."
          />
        </div>
      </section>

      <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm sm:p-7">
        <h2 className="text-xl font-semibold text-zinc-950">Локация</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Укажите город и район, чтобы покупателям было проще найти вас и ваши объявления.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <ProfileTextField
            label="Регион"
            value={form.region}
            onChange={(v) => patch({ region: v })}
            error={fieldErrors.region}
            placeholder="Московская область"
          />
          <label className="block">
            <span className="text-sm font-medium text-zinc-600">Город</span>
            <input
              list={cityListId}
              value={form.city}
              onChange={(e) => patch({ city: e.target.value })}
              placeholder="Москва"
              className={
                fieldErrors.city
                  ? "mt-2 h-12 w-full rounded-2xl border border-red-300 bg-red-50/40 px-4 text-sm outline-none"
                  : "mt-2 h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm outline-none focus:border-[hsl(var(--nashlo-orange))] focus:bg-white"
              }
            />
            <datalist id={cityListId}>
              {NASHLO_CITIES_FOR_LISTING.map((city) => (
                <option key={city} value={city} />
              ))}
            </datalist>
            {fieldErrors.city ? (
              <p className="mt-1.5 text-xs text-red-600">{fieldErrors.city}</p>
            ) : null}
          </label>
          <ProfileTextField
            label="Район / метро"
            value={form.district}
            onChange={(v) => patch({ district: v })}
            error={fieldErrors.district}
            placeholder="Район или станция метро"
          />
          <ProfileTextField
            label="Метро (уточнение)"
            value={form.metro}
            onChange={(v) => patch({ metro: v })}
            error={fieldErrors.metro}
          />
          <div className="sm:col-span-2">
            <ProfileTextField
              label="Ориентир или удобное место встречи"
              value={form.addressNote}
              onChange={(v) => patch({ addressNote: v })}
              error={fieldErrors.addressNote}
              hint="Необязательно. Точный адрес не показывается публично."
              placeholder="Рядом с ТЦ, у метро…"
              maxLength={120}
            />
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm sm:p-7">
        <h2 className="text-xl font-semibold text-zinc-950">Тип профиля</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {(["PERSON", "COMPANY"] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => patch({ profileType: type })}
              className={`rounded-2xl px-4 py-2.5 text-sm font-semibold transition ${
                form.profileType === type
                  ? "bg-zinc-950 text-white"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              {type === "PERSON" ? "Частное лицо" : "Бизнес"}
            </button>
          ))}
        </div>

        {form.profileType === "PERSON" ? (
          <label className="mt-4 block">
            <span className="text-sm font-medium text-zinc-600">Чем занимаетесь</span>
            <select
              value={form.sellerRole}
              onChange={(e) => patch({ sellerRole: e.target.value })}
              className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm outline-none focus:border-[hsl(var(--nashlo-orange))] focus:bg-white"
            >
              <option value="">Выберите вариант</option>
              {SELLER_ROLE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <ProfileTextField
                label="Название компании"
                value={form.companyName}
                onChange={(v) => patch({ companyName: v })}
                error={fieldErrors.companyName}
              />
            </div>
            <ProfileTextField
              label="Сфера деятельности"
              value={form.businessCategory}
              onChange={(v) => patch({ businessCategory: v })}
              error={fieldErrors.businessCategory}
            />
            <ProfileTextField
              label="Должность / роль"
              value={form.companyRole}
              onChange={(v) => patch({ companyRole: v })}
              error={fieldErrors.companyRole}
            />
            <ProfileTextField
              label="ИНН"
              value={form.companyInn}
              onChange={(v) => patch({ companyInn: v.replace(/\D/g, "").slice(0, 12) })}
              error={fieldErrors.companyInn}
              hint="Необязательно, не показывается публично"
            />
            <ProfileTextField
              label="Сайт компании"
              value={form.companyWebsite}
              onChange={(v) => patch({ companyWebsite: v })}
              error={fieldErrors.companyWebsite}
              placeholder="https://"
            />
          </div>
        )}
      </section>

      <details className="group rounded-[28px] border border-zinc-200 bg-white shadow-sm open:shadow-sm">
        <summary className="cursor-pointer list-none rounded-[28px] p-5 sm:p-7 [&::-webkit-details-marker]:hidden">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-zinc-950">О продавце</h2>
              <p className="mt-1 text-sm text-zinc-500">Опыт, зона работы и условия — по желанию.</p>
            </div>
            <span className="text-sm font-semibold text-zinc-400 group-open:rotate-180">▼</span>
          </div>
        </summary>
        <div className="border-t border-zinc-100 px-5 pb-5 pt-4 sm:px-7 sm:pb-7">
          <div className="grid gap-4 sm:grid-cols-2">
            <ProfileTextField
              label="Сфера деятельности"
              value={form.businessCategory}
              onChange={(v) => patch({ businessCategory: v })}
              error={fieldErrors.businessCategory}
            />
            <label className="block">
              <span className="text-sm font-medium text-zinc-600">Опыт</span>
              <select
                value={form.experience}
                onChange={(e) => patch({ experience: e.target.value })}
                className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm outline-none focus:border-[hsl(var(--nashlo-orange))] focus:bg-white"
              >
                <option value="">Не указан</option>
                {EXPERIENCE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="sm:col-span-2">
              <ProfileTextField
                label="Где работаете / зона обслуживания"
                value={form.serviceArea}
                onChange={(v) => patch({ serviceArea: v })}
                error={fieldErrors.serviceArea}
                placeholder="Москва и область"
              />
            </div>
          </div>
          <p className="mt-4 text-sm font-medium text-zinc-600">Доставка / встреча</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {DELIVERY_OPTIONS.map((o) => {
              const active = form.deliveryOptions.includes(o.value)
              return (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => toggleDelivery(o.value)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    active
                      ? "bg-[hsl(var(--nashlo-orange))] text-white"
                      : "border border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300"
                  }`}
                >
                  {o.label}
                </button>
              )
            })}
          </div>
          <div className="mt-4">
            <ProfileTextareaField
              label="Гарантии / условия"
              value={form.guaranteeText}
              onChange={(v) => patch({ guaranteeText: v })}
              error={fieldErrors.guaranteeText}
              placeholder="Например: гарантия на работу 14 дней, проверка перед покупкой, возврат по договорённости."
              maxLength={300}
              rows={3}
            />
          </div>
        </div>
      </details>

      <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm sm:p-7">
        <h2 className="text-xl font-semibold text-zinc-950">Контакты и публичность</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Вы сами выбираете, какие данные видны другим пользователям.
        </p>
        <div className="mt-4 space-y-2">
          <PrivacySwitch
            label="Показывать телефон в профиле"
            description="Отдельно от кнопки в объявлениях"
            checked={form.showPhonePublicly}
            disabled={!form.phone}
            onChange={(v) => patch({ showPhonePublicly: v })}
          />
          <PrivacySwitch
            label="Показывать email в профиле"
            checked={form.showEmailPublicly}
            disabled={!form.email}
            onChange={(v) => patch({ showEmailPublicly: v })}
          />
          <PrivacySwitch
            label="Показывать город"
            checked={form.showCityPublicly}
            onChange={(v) => patch({ showCityPublicly: v })}
          />
          <PrivacySwitch
            label="Показывать район"
            checked={form.showDistrictPublicly}
            onChange={(v) => patch({ showDistrictPublicly: v })}
          />
          <PrivacySwitch
            label="Показывать активность на сайте"
            checked={form.showActivityPublicly}
            onChange={(v) => patch({ showActivityPublicly: v })}
          />
          <PrivacySwitch
            label="Показывать значки"
            checked={form.showBadgesPublicly}
            onChange={(v) => patch({ showBadgesPublicly: v })}
          />
          <PrivacySwitch
            label="Показывать отзывы"
            checked={form.showReviewsPublicly}
            onChange={(v) => patch({ showReviewsPublicly: v })}
          />
        </div>
      </section>

      <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm sm:p-7">
        <h2 className="text-xl font-semibold text-zinc-950">Социальные ссылки</h2>
        <p className="mt-1 text-sm text-zinc-500">VK, MAX и сайт — только проверенные ссылки https.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <ProfileTextField
            label="VK"
            value={form.vkUrl}
            onChange={(v) => patch({ vkUrl: v })}
            error={fieldErrors.vkUrl}
            placeholder="https://vk.com/…"
          />
          <ProfileTextField
            label="MAX"
            value={form.maxUrl}
            onChange={(v) => patch({ maxUrl: v })}
            error={fieldErrors.maxUrl}
            placeholder="https://"
          />
          <div className="sm:col-span-2">
            <ProfileTextField
              label="Сайт"
              value={form.websiteUrl}
              onChange={(v) => patch({ websiteUrl: v })}
              error={fieldErrors.websiteUrl}
              placeholder="https://"
            />
          </div>
        </div>
      </section>

      {completeness ? (
        <section className="rounded-[28px] border border-orange-100 bg-orange-50/40 p-5 sm:p-7">
          <h2 className="text-lg font-semibold text-zinc-950">Доверие и заполненность</h2>
          <p className="mt-2 text-sm text-zinc-600">
            Заполнение профиля помогает покупателям доверять вам и открывает бонусы Нашло.
          </p>
          {completeness.hints.length > 0 ? (
            <ul className="mt-3 space-y-1.5 text-sm text-zinc-700">
              {completeness.hints.slice(0, 5).map((hint) => (
                <li key={hint} className="flex gap-2">
                  <span className="text-[hsl(var(--nashlo-orange))]">•</span>
                  {hint}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm font-medium text-emerald-700">Профиль заполнен полностью — отлично!</p>
          )}
        </section>
      ) : null}

      <div className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm sm:p-7">
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="h-12 w-full rounded-2xl bg-[hsl(var(--nashlo-orange))] px-6 text-sm font-semibold text-white disabled:opacity-50 sm:w-auto"
        >
          {saving ? "Сохраняем…" : "Сохранить данные профиля"}
        </button>
        {profileSuccess && (
          <p className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">Профиль сохранён</p>
        )}
      </div>
    </>
  )
}
