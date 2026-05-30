"use client"

import Link from "next/link"
import { LEGAL_LINKS } from "@/lib/legal-meta"

type Props = {
  checked: boolean
  onChange: (checked: boolean) => void
  id?: string
  /** меньше отступы для модального окна */
  compact?: boolean
}

/** Чекбокс согласия с документами для входа/регистрации по телефону (не отмечен по умолчанию). */
export function AuthLegalConsentFields({ checked, onChange, id = "auth-legal-consent", compact }: Props) {
  return (
    <label
      className={
        "flex cursor-pointer gap-2.5 rounded-2xl border border-zinc-200/90 bg-zinc-50/80 px-3 py-2.5 text-left " +
        (compact ? "text-[11px] leading-snug text-zinc-600" : "text-xs leading-snug text-zinc-600")
      }
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 rounded border-zinc-300 text-[hsl(var(--nashlo-orange))] focus:ring-[hsl(var(--nashlo-orange))]"
      />
      <span>
        Я принимаю{" "}
        <Link href={LEGAL_LINKS.userAgreement} className="font-medium text-zinc-950 underline underline-offset-2">
          Пользовательское соглашение
        </Link>
        , даю{" "}
        <Link href={LEGAL_LINKS.personalDataConsent} className="font-medium text-zinc-950 underline underline-offset-2">
          согласие на обработку персональных данных
        </Link>{" "}
        и подтверждаю ознакомление с{" "}
        <Link href={LEGAL_LINKS.privacyPolicy} className="font-medium text-zinc-950 underline underline-offset-2">
          Политикой обработки персональных данных
        </Link>
        .
      </span>
    </label>
  )
}
