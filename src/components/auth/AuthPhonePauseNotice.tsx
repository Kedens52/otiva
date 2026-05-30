import { cn } from "@/lib/utils"

type AuthPhonePauseNoticeProps = {
  className?: string
}

/** Пока SMS-вход в разработке — направляем на VK / Яндекс ID. */
export function AuthPhonePauseNotice({ className }: AuthPhonePauseNoticeProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-amber-200/90 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-950",
        className,
      )}
      role="status"
    >
      <p className="font-semibold">Вход по номеру телефона пока подключаем</p>
      <p className="mt-1 text-amber-900/90">
        Сейчас войти или зарегистрироваться можно через{" "}
        <span className="font-semibold">VK</span> или{" "}
        <span className="font-semibold">Яндекс ID</span> — это быстро и без SMS.
      </p>
    </div>
  )
}
