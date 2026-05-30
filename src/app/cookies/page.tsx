import Link from "next/link"
import { CookiePreferencesPanel } from "@/components/legal/CookieBanner"
import { LegalStandaloneShell } from "@/components/legal/LegalStandaloneShell"
import { ResponsiveTableCards } from "@/components/ui/ResponsiveTableCards"

export const metadata = { title: "Политика cookies — Нашло" }

const COOKIE_ROWS = [
  {
    name: "nashlo_admin_session",
    type: "Необходимый",
    purpose: "Сессия администратора",
  },
  {
    name: "nashlo-city",
    type: "Функциональный",
    purpose: "Выбранный город (localStorage)",
  },
  {
    name: "nashlo_analytics",
    type: "Аналитический",
    purpose: "Согласие на учёт посещений (только после «Принять все»)",
  },
  {
    name: "nashlo_vid",
    type: "Аналитический",
    purpose: "Анонимный идентификатор посетителя для статистики",
  },
  {
    name: "nashlo_session",
    type: "Необходимый",
    purpose: "Сессия входа пользователя",
  },
] as const

export default function CookiesPage() {
  return (
    <LegalStandaloneShell>
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">Политика использования файлов cookie</h1>
      <p className="mt-2 text-sm text-zinc-500">Редакция от 1 января 2025 г.</p>
      <div className="mt-8 space-y-8 text-sm leading-7 text-zinc-700">
        <section>
          <h2 className="text-base font-semibold text-zinc-950">1. Что такое cookies</h2>
          <p className="mt-3">Cookie — небольшой текстовый файл, который сайт сохраняет в вашем браузере при посещении. Cookies не являются программами, не могут быть использованы для получения доступа к вашему компьютеру и не содержат вирусов. Они помогают сайту запоминать ваши настройки и обеспечивают корректную работу сервисов.</p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-zinc-950">2. Какие cookies мы используем</h2>
          <div className="mt-3 space-y-4">
            <div className="rounded-2xl border border-zinc-100 p-4">
              <p className="font-semibold text-zinc-950">Необходимые (обязательные)</p>
              <p className="mt-1 text-zinc-500">Обеспечивают базовую работу сайта: авторизацию, безопасность сессии, выбор города. Без них сайт работать не может. Не требуют согласия.</p>
            </div>
            <div className="rounded-2xl border border-zinc-100 p-4">
              <p className="font-semibold text-zinc-950">Функциональные</p>
              <p className="mt-1 text-zinc-500">Запоминают ваши предпочтения: выбранный город, фильтры поиска, настройки отображения. Улучшают удобство использования.</p>
            </div>
            <div className="rounded-2xl border border-zinc-100 p-4">
              <p className="font-semibold text-zinc-950">Аналитические</p>
              <p className="mt-1 text-zinc-500">Помогают понять, как пользователи взаимодействуют с сайтом: какие страницы посещают, сколько времени проводят. Данные обезличены и не позволяют идентифицировать конкретного пользователя.</p>
            </div>
          </div>
        </section>
        <section>
          <h2 className="text-base font-semibold text-zinc-950">3. Конкретные файлы cookie</h2>
          <div className="mt-3">
            <ResponsiveTableCards
              rowKey="name"
              columns={[
                { key: "name", label: "Название", mono: true },
                { key: "type", label: "Тип" },
                { key: "purpose", label: "Назначение" },
              ]}
              rows={[...COOKIE_ROWS]}
            />
          </div>
        </section>
        <section>
          <h2 className="text-base font-semibold text-zinc-950">4. Управление cookies</h2>
          <CookiePreferencesPanel className="mt-4" />
          <p className="mt-4">Также можно управлять cookie через настройки браузера. Отключение необходимых cookies может привести к некорректной работе сайта. Инструкции для популярных браузеров:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Google Chrome: Настройки → Конфиденциальность → Файлы cookie</li>
            <li>Яндекс Браузер: Настройки → Сайты → Расширенные настройки → Cookies</li>
            <li>Mozilla Firefox: Настройки → Приватность и защита → Куки и данные сайтов</li>
            <li>Safari: Настройки → Конфиденциальность → Файлы cookie</li>
          </ul>
        </section>
        <section>
          <h2 className="text-base font-semibold text-zinc-950">5. Согласие</h2>
          <p className="mt-3">
            Необходимые cookie работают без отдельного согласия. Аналитические cookie включаются только после нажатия
            «Принять все» в уведомлении на сайте. Отказ («Только необходимые») отключает учёт посещений в нашей
            статистике. Согласие можно изменить в блоке настроек выше.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-zinc-950">6. Контакты</h2>
          <p className="mt-3">По вопросам использования cookies: privacy@nashlo.ru</p>
        </section>
      </div>
      <div className="mt-10 flex flex-wrap gap-4 text-xs text-zinc-400">
        <Link href="/terms" className="underline underline-offset-2 hover:text-zinc-700">Пользовательское соглашение</Link>
        <Link href="/privacy" className="underline underline-offset-2 hover:text-zinc-700">Политика конфиденциальности</Link>
      </div>
    </LegalStandaloneShell>
  )
}
