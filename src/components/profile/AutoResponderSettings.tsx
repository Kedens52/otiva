"use client"

import { useEffect, useState } from "react"

const OPENER_KEY    = "otiva-opener-template"
const AUTOREPLY_KEY = "otiva-autoreply-enabled"
const REPLIES_KEY   = "otiva-autoreply-text"
const DELAY_KEY     = "otiva-autoreply-delay"

const DEFAULT_OPENER = "Здравствуйте! Меня интересует ваше объявление «{listing}». Оно ещё актуально?"
const DEFAULT_REPLY  = "Здравствуйте! Спасибо за интерес. Объявление актуально, готов ответить на вопросы."

const DELAYS = [
  { value: "0",    label: "Мгновенно"    },
  { value: "300",  label: "5 минут"      },
  { value: "1800", label: "30 минут"     },
  { value: "3600", label: "1 час"        },
]

export function AutoResponderSettings() {
  const [opener,    setOpener]    = useState(DEFAULT_OPENER)
  const [enabled,   setEnabled]   = useState(false)
  const [replyText, setReplyText] = useState(DEFAULT_REPLY)
  const [delay,     setDelay]     = useState("0")
  const [saved,     setSaved]     = useState(false)

  useEffect(() => {
    setOpener(localStorage.getItem(OPENER_KEY)     || DEFAULT_OPENER)
    setEnabled(localStorage.getItem(AUTOREPLY_KEY)  === "true")
    setReplyText(localStorage.getItem(REPLIES_KEY)  || DEFAULT_REPLY)
    setDelay(localStorage.getItem(DELAY_KEY)        || "0")
  }, [])

  function save() {
    localStorage.setItem(OPENER_KEY,    opener)
    localStorage.setItem(AUTOREPLY_KEY, String(enabled))
    localStorage.setItem(REPLIES_KEY,   replyText)
    localStorage.setItem(DELAY_KEY,     delay)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm sm:rounded-[32px] sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-zinc-950 sm:text-2xl">Сообщения и автоответчик</h2>
          <p className="mt-1 text-sm text-zinc-500">Шаблон первого сообщения и автоматический ответ на входящие.</p>
        </div>
        <button onClick={save} className="w-full rounded-2xl bg-zinc-950 px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-800 sm:w-auto">
          {saved ? "✓ Сохранено" : "Сохранить"}
        </button>
      </div>

      {/* Opener */}
      <div className="mt-6">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-zinc-700">Шаблон первого сообщения покупателя</p>
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500">✉ авто-подстановка</span>
        </div>
        <p className="mt-1 text-xs text-zinc-400">
          Подставляется при нажатии «Написать продавцу». Используйте{" "}
          <code className="rounded bg-zinc-100 px-1">{"{listing}"}</code> для названия объявления.
        </p>
        <textarea
          value={opener}
          onChange={(e) => setOpener(e.target.value)}
          rows={3}
          className="mt-2 w-full resize-none rounded-2xl border border-zinc-200 px-4 py-3 text-sm text-zinc-950 outline-none transition focus:border-[hsl(var(--otiva-orange))]"
        />
        <div className="mt-2 flex flex-wrap gap-2">
          {[
            "Здравствуйте! Объявление ещё актуально?",
            "Добрый день, возможен торг?",
            "Привет! Можно посмотреть сегодня?",
          ].map((t) => (
            <button key={t} onClick={() => setOpener(t)} className="rounded-full border border-zinc-200 px-3 py-1.5 text-xs text-zinc-600 transition hover:border-[hsl(var(--otiva-orange))] hover:text-[hsl(var(--otiva-orange))]">
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Auto-responder */}
      <div className="mt-6 overflow-hidden rounded-[22px] border border-zinc-200">
        <div className="flex items-center justify-between gap-4 p-4">
          <div>
            <p className="font-semibold text-zinc-950">Автоответчик</p>
            <p className="mt-0.5 text-sm text-zinc-500">Автоматически отвечает на первое сообщение покупателя</p>
          </div>
          <label className="relative inline-flex cursor-pointer items-center shrink-0">
            <input type="checkbox" checked={enabled} onChange={() => setEnabled((v) => !v)} className="sr-only peer" />
            <div className="h-6 w-11 rounded-full bg-zinc-200 transition peer-checked:bg-[hsl(var(--otiva-orange))] after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow-sm after:transition-all peer-checked:after:translate-x-5" />
          </label>
        </div>

        {enabled && (
          <div className="space-y-5 border-t border-zinc-100 bg-zinc-50 p-4">
            <div>
              <p className="text-sm font-medium text-zinc-700">Текст автоответа</p>
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={3}
                className="mt-2 w-full resize-none rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-950 outline-none transition focus:border-[hsl(var(--otiva-orange))]"
              />
              <div className="mt-2 flex flex-wrap gap-2">
                {[
                  "Объявление актуально, готов ответить на вопросы.",
                  "Здравствуйте! Да, в наличии. Когда удобно созвониться?",
                  "Добрый день! Отвечу чуть позже, сейчас занят.",
                ].map((t) => (
                  <button key={t} onClick={() => setReplyText(t)} className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-600 transition hover:border-[hsl(var(--otiva-orange))] hover:text-[hsl(var(--otiva-orange))]">
                    {t.length > 36 ? t.slice(0, 36) + "…" : t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-zinc-700">Задержка перед отправкой</p>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {DELAYS.map((d) => (
                  <button
                    key={d.value}
                    onClick={() => setDelay(d.value)}
                    className={`rounded-2xl border-2 py-2.5 text-sm font-medium transition ${delay === d.value ? "border-[hsl(var(--otiva-orange))] bg-white text-[hsl(var(--otiva-orange))]" : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300"}`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            <p className="rounded-2xl bg-white px-4 py-3 text-xs text-zinc-400">
              Демо: настройки сохраняются локально. В продакшене автоответ отправляется сервером после получения сообщения.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
