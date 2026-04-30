"use client"

import { useState } from "react"

const DEFAULT_FILTERS = [
  { id: "contacts", title: "Контакты в описании",  desc: "Телефоны, мессенджеры и внешние ссылки в тексте объявления", level: "Высокий", enabled: true  },
  { id: "price",    title: "Подозрительная цена",  desc: "Цена значительно ниже рыночного уровня в категории",          level: "Средний", enabled: true  },
  { id: "dupes",    title: "Дубликаты объявлений", desc: "Повтор заголовка, фото или текста описания",                  level: "Высокий", enabled: true  },
  { id: "words",    title: "Стоп-слова",            desc: "Запрещённые товары, обещания лёгкого заработка и спам",       level: "Средний", enabled: false },
  { id: "flood",    title: "Флуд-лимит",            desc: "Более 5 объявлений в сутки от одного аккаунта",              level: "Низкий",  enabled: true  },
  { id: "newuser",  title: "Новый аккаунт",         desc: "Объявление от профиля младше 24 часов — на ручную проверку", level: "Низкий",  enabled: false },
]

const DEFAULT_PLUGINS = [
  { id: "vision", title: "Проверка изображений",  desc: "Находит водяные знаки, запрещённые товары и дубли фото",            active: true  },
  { id: "risk",   title: "Риск-скоринг продавца", desc: "Оценивает репутацию по жалобам, скорости ответов и истории",        active: true  },
  { id: "geo",    title: "Гео-антиспам",           desc: "Ловит массовые публикации из разных городов за короткий период",    active: false },
  { id: "nlp",    title: "NLP-анализ текста",      desc: "Определяет тональность и выявляет скрытые контакты в описании",    active: false },
  { id: "price2", title: "Ценовой ML-маркер",      desc: "Модель на ценах категорий — сигнализирует об аномалиях",           active: false },
]

const AI_PROVIDERS = [
  { id: "openai",    label: "OpenAI GPT-4o",      hint: "Лучшая точность, выше стоимость"     },
  { id: "claude",    label: "Anthropic Claude",    hint: "Хорошо понимает контекст и нюансы"   },
  { id: "deepseek",  label: "DeepSeek",            hint: "Быстрый и дешёвый вариант"           },
  { id: "yandexgpt", label: "YandexGPT",           hint: "Оптимизирован для русского языка"    },
]

const AI_CHECKS = [
  { id: "title",       label: "Заголовок объявления"  },
  { id: "description", label: "Текст описания"         },
  { id: "images",      label: "Изображения (vision)"   },
  { id: "seller",      label: "История продавца"        },
]

const STOP_WORDS_DEFAULT = `кредит без отказа
заработок дома
форекс
быстрые деньги
казино`

const LEVEL_COLOR: Record<string, string> = {
  "Высокий": "bg-red-50 text-red-600",
  "Средний": "bg-[hsl(var(--otiva-orange)/0.12)] text-[hsl(var(--otiva-orange))]",
  "Низкий":  "bg-zinc-100 text-zinc-500",
}

export default function AdminSettingsPage() {
  const [filters,     setFilters]     = useState(DEFAULT_FILTERS)
  const [plugins,     setPlugins]     = useState(DEFAULT_PLUGINS)
  const [stopWords,   setStopWords]   = useState(STOP_WORDS_DEFAULT)
  const [saved,       setSaved]       = useState(false)

  // AI moderation state
  const [aiEnabled,   setAiEnabled]   = useState(false)
  const [aiProvider,  setAiProvider]  = useState("openai")
  const [apiKey,      setApiKey]      = useState("")
  const [aiAction,    setAiAction]    = useState<"flag" | "reject" | "approve">("flag")
  const [threshold,   setThreshold]   = useState(75)
  const [aiChecks,    setAiChecks]    = useState<Record<string, boolean>>(
    Object.fromEntries(AI_CHECKS.map((c) => [c.id, c.id !== "images"]))
  )
  const [aiPrompt,    setAiPrompt]    = useState(
    "Ты — модератор объявлений. Проверь объявление на наличие запрещённого контента, обмана, контактов в тексте и подозрительных обещаний. Ответь JSON: {\"verdict\": \"ok\" | \"suspicious\" | \"reject\", \"reason\": \"...\"}"
  )
  const [testResult,  setTestResult]  = useState("")
  const [testing,     setTesting]     = useState(false)

  function toggleFilter(id: string) {
    setFilters((f) => f.map((x) => x.id === id ? { ...x, enabled: !x.enabled } : x))
    setSaved(false)
  }

  function togglePlugin(id: string) {
    setPlugins((p) => p.map((x) => x.id === id ? { ...x, active: !x.active } : x))
    setSaved(false)
  }

  function toggleAiCheck(id: string) {
    setAiChecks((c) => ({ ...c, [id]: !c[id] }))
    setSaved(false)
  }

  function save() {
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  async function testConnection() {
    if (!apiKey.trim()) {
      setTestResult("error:Введите API-ключ для проверки подключения")
      return
    }
    setTesting(true)
    setTestResult("")
    await new Promise((r) => setTimeout(r, 1800))
    setTesting(false)
    setTestResult("ok:Подключение успешно. Модель отвечает корректно.")
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">Настройки модерации</h1>
          <p className="mt-1 text-sm text-zinc-500">Автофильтры, плагины, ИИ-модерация и стоп-слова.</p>
        </div>
        <button onClick={save} className="rounded-2xl bg-zinc-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800">
          {saved ? "✓ Сохранено" : "Сохранить настройки"}
        </button>
      </div>

      {/* AI Moderation */}
      <section className="mt-8">
        <div className="overflow-hidden rounded-[28px] border-2 border-zinc-200 bg-white shadow-sm">
          {/* Header */}
          <div className={`flex items-center justify-between gap-4 px-6 py-5 ${aiEnabled ? "border-b border-zinc-100" : ""}`}>
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-2xl text-xl ${aiEnabled ? "bg-[hsl(var(--otiva-orange)/0.12)]" : "bg-zinc-100"}`}>
                🤖
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold text-zinc-950">ИИ-модерация</h2>
                  {aiEnabled && (
                    <span className="rounded-full bg-[hsl(var(--otiva-mint)/0.15)] px-2.5 py-0.5 text-xs font-semibold text-[hsl(var(--otiva-mint))]">
                      Активна
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-sm text-zinc-500">
                  Подключите языковую модель для автоматической проверки объявлений
                </p>
              </div>
            </div>
            <label className="relative inline-flex cursor-pointer items-center shrink-0">
              <input type="checkbox" checked={aiEnabled} onChange={() => { setAiEnabled((v) => !v); setSaved(false) }} className="sr-only peer" />
              <div className="h-7 w-14 rounded-full bg-zinc-200 transition peer-checked:bg-[hsl(var(--otiva-orange))] after:absolute after:left-[3px] after:top-[3px] after:h-[22px] after:w-[22px] after:rounded-full after:bg-white after:shadow after:transition-all peer-checked:after:translate-x-7" />
            </label>
          </div>

          {aiEnabled && (
            <div className="p-6 space-y-6">
              {/* Provider + API key */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-zinc-700">Провайдер</label>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {AI_PROVIDERS.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => { setAiProvider(p.id); setSaved(false) }}
                        className={`rounded-2xl border-2 p-3 text-left transition ${aiProvider === p.id ? "border-[hsl(var(--otiva-orange))] bg-[hsl(var(--otiva-orange)/0.05)]" : "border-zinc-200 hover:border-zinc-300"}`}
                      >
                        <p className="text-sm font-semibold text-zinc-950">{p.label}</p>
                        <p className="mt-0.5 text-xs text-zinc-500">{p.hint}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-zinc-700">API-ключ</label>
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(e) => { setApiKey(e.target.value); setSaved(false); setTestResult("") }}
                      placeholder="sk-..."
                      className="mt-2 h-11 w-full rounded-2xl border border-zinc-200 px-4 text-sm outline-none transition focus:border-[hsl(var(--otiva-orange))]"
                    />
                  </div>
                  <button
                    onClick={testConnection}
                    disabled={testing}
                    className="w-full rounded-2xl border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50 disabled:opacity-50"
                  >
                    {testing ? "Проверяем соединение…" : "Проверить подключение"}
                  </button>
                  {testResult && (
                    <p className={`rounded-2xl px-4 py-3 text-sm font-medium ${testResult.startsWith("ok:") ? "bg-[hsl(var(--otiva-mint)/0.12)] text-[hsl(var(--otiva-mint))]" : "bg-red-50 text-red-600"}`}>
                      {testResult.split(":").slice(1).join(":")}
                    </p>
                  )}
                </div>
              </div>

              {/* What to check */}
              <div>
                <p className="text-sm font-medium text-zinc-700">Что проверять</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {AI_CHECKS.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => toggleAiCheck(c.id)}
                      className={`rounded-full border px-4 py-2 text-sm font-medium transition ${aiChecks[c.id] ? "border-[hsl(var(--otiva-orange))] bg-[hsl(var(--otiva-orange)/0.08)] text-[hsl(var(--otiva-orange))]" : "border-zinc-200 text-zinc-500 hover:border-zinc-300"}`}
                    >
                      {aiChecks[c.id] ? "✓ " : ""}{c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action + threshold */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-zinc-700">Действие при срабатывании</p>
                  <div className="mt-2 space-y-2">
                    {([
                      { id: "flag",    label: "Отправить на ручную проверку", color: "border-[hsl(var(--otiva-orange))]" },
                      { id: "reject",  label: "Автоматически отклонить",       color: "border-red-400" },
                      { id: "approve", label: "Автоматически одобрить",         color: "border-[hsl(var(--otiva-mint))]" },
                    ] as const).map((a) => (
                      <label key={a.id} className={`flex cursor-pointer items-center gap-3 rounded-2xl border-2 p-3 transition ${aiAction === a.id ? a.color + " bg-zinc-50" : "border-zinc-200"}`}>
                        <input type="radio" name="aiAction" checked={aiAction === a.id} onChange={() => { setAiAction(a.id); setSaved(false) }} className="accent-[hsl(var(--otiva-orange))]" />
                        <span className="text-sm font-medium text-zinc-950">{a.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-zinc-700">
                    Порог уверенности: <span className="text-[hsl(var(--otiva-orange))]">{threshold}%</span>
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">Ниже порога — решение передаётся модератору</p>
                  <input
                    type="range"
                    min={50} max={99} step={1}
                    value={threshold}
                    onChange={(e) => { setThreshold(Number(e.target.value)); setSaved(false) }}
                    className="mt-4 w-full accent-[hsl(var(--otiva-orange))]"
                  />
                  <div className="mt-1 flex justify-between text-xs text-zinc-400">
                    <span>50% — мягко</span>
                    <span>99% — строго</span>
                  </div>
                </div>
              </div>

              {/* System prompt */}
              <div>
                <p className="text-sm font-medium text-zinc-700">Системный промпт</p>
                <p className="mt-0.5 text-xs text-zinc-500">Инструкция для модели. Ответ должен быть JSON с полями verdict и reason.</p>
                <textarea
                  value={aiPrompt}
                  onChange={(e) => { setAiPrompt(e.target.value); setSaved(false) }}
                  className="mt-2 h-28 w-full rounded-2xl border border-zinc-200 px-4 py-3 font-mono text-xs text-zinc-950 outline-none transition focus:border-[hsl(var(--otiva-orange))]"
                />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Filters */}
      <section className="mt-8">
        <h2 className="text-xl font-semibold text-zinc-950">Автофильтры</h2>
        <p className="mt-1 text-sm text-zinc-500">Правила, по которым система автоматически отправляет объявления на проверку или блокирует их.</p>
        <div className="mt-4 overflow-hidden rounded-[24px] border border-zinc-200 bg-white shadow-sm">
          {filters.map((f, i) => (
            <div key={f.id} className={`flex items-center gap-4 px-5 py-4 ${i < filters.length - 1 ? "border-b border-zinc-100" : ""}`}>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-zinc-950">{f.title}</p>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${LEVEL_COLOR[f.level]}`}>{f.level}</span>
                </div>
                <p className="mt-0.5 text-sm text-zinc-500">{f.desc}</p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input type="checkbox" checked={f.enabled} onChange={() => toggleFilter(f.id)} className="sr-only peer" />
                <div className="h-6 w-11 rounded-full bg-zinc-200 transition peer-checked:bg-[hsl(var(--otiva-orange))] after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow-sm after:transition-all peer-checked:after:translate-x-5" />
              </label>
            </div>
          ))}
        </div>
      </section>

      {/* Plugins */}
      <section className="mt-8">
        <h2 className="text-xl font-semibold text-zinc-950">Плагины проверки</h2>
        <p className="mt-1 text-sm text-zinc-500">Дополнительные модули, которые усиливают автоматическую модерацию.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {plugins.map((p) => (
            <div key={p.id} className={`flex items-start gap-4 rounded-[20px] border p-4 transition ${p.active ? "border-[hsl(var(--otiva-orange)/0.4)] bg-[hsl(var(--otiva-orange)/0.04)]" : "border-zinc-200 bg-white"}`}>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-zinc-950">{p.title}</p>
                  {p.active && <span className="rounded-full bg-[hsl(var(--otiva-mint)/0.15)] px-2 py-0.5 text-[11px] font-semibold text-[hsl(var(--otiva-mint))]">Активен</span>}
                </div>
                <p className="mt-1 text-sm leading-5 text-zinc-500">{p.desc}</p>
              </div>
              <label className="relative mt-0.5 inline-flex shrink-0 cursor-pointer items-center">
                <input type="checkbox" checked={p.active} onChange={() => togglePlugin(p.id)} className="sr-only peer" />
                <div className="h-6 w-11 rounded-full bg-zinc-200 transition peer-checked:bg-[hsl(var(--otiva-orange))] after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow-sm after:transition-all peer-checked:after:translate-x-5" />
              </label>
            </div>
          ))}
        </div>
      </section>

      {/* Stop words */}
      <section className="mt-8">
        <h2 className="text-xl font-semibold text-zinc-950">Стоп-слова</h2>
        <p className="mt-1 text-sm text-zinc-500">Каждое слово или фраза — с новой строки. Объявления с совпадением уйдут на ручную проверку.</p>
        <textarea
          value={stopWords}
          onChange={(e) => { setStopWords(e.target.value); setSaved(false) }}
          className="mt-4 h-40 w-full rounded-[20px] border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-950 outline-none transition focus:border-[hsl(var(--otiva-orange))]"
        />
      </section>

      {/* Danger zone */}
      <section className="mt-8 rounded-[24px] border border-red-200 bg-red-50 p-5">
        <h2 className="text-lg font-semibold text-red-700">Опасная зона</h2>
        <p className="mt-1 text-sm text-red-500">Эти действия необратимы и применяются ко всей базе.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button className="rounded-2xl border border-red-300 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100">
            Очистить очередь модерации
          </button>
          <button className="rounded-2xl border border-red-300 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100">
            Сбросить фильтры к умолчанию
          </button>
        </div>
      </section>
    </div>
  )
}
