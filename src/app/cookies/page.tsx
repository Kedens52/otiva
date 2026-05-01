import Link from "next/link"

export const metadata = { title: "Политика cookies — Нашло" }

export default function CookiesPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 pb-28 lg:pb-12">
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
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-zinc-100">
                  <th className="py-2 pr-4 text-left font-semibold text-zinc-950">Название</th>
                  <th className="py-2 pr-4 text-left font-semibold text-zinc-950">Тип</th>
                  <th className="py-2 text-left font-semibold text-zinc-950">Назначение</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                <tr><td className="py-2 pr-4 font-mono text-zinc-600">nashlo_admin_session</td><td className="py-2 pr-4">Необходимый</td><td className="py-2">Сессия администратора</td></tr>
                <tr><td className="py-2 pr-4 font-mono text-zinc-600">nashlo-city</td><td className="py-2 pr-4">Функциональный</td><td className="py-2">Выбранный город</td></tr>
                <tr><td className="py-2 pr-4 font-mono text-zinc-600">sb-*</td><td className="py-2 pr-4">Необходимый</td><td className="py-2">Сессия авторизации Supabase</td></tr>
              </tbody>
            </table>
          </div>
        </section>
        <section>
          <h2 className="text-base font-semibold text-zinc-950">4. Управление cookies</h2>
          <p className="mt-3">Вы можете управлять файлами cookie через настройки браузера. Отключение необходимых cookies может привести к некорректной работе сайта. Инструкции для популярных браузеров:</p>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li>Google Chrome: Настройки → Конфиденциальность → Файлы cookie</li>
            <li>Яндекс Браузер: Настройки → Сайты → Расширенные настройки → Cookies</li>
            <li>Mozilla Firefox: Настройки → Приватность и защита → Куки и данные сайтов</li>
            <li>Safari: Настройки → Конфиденциальность → Файлы cookie</li>
          </ul>
        </section>
        <section>
          <h2 className="text-base font-semibold text-zinc-950">5. Согласие</h2>
          <p className="mt-3">Продолжая использовать сайт nashlo.ru, вы соглашаетесь на использование файлов cookie в соответствии с настоящей Политикой. Согласие на использование необязательных cookies вы можете отозвать в любой момент через настройки браузера.</p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-zinc-950">6. Контакты</h2>
          <p className="mt-3">По вопросам использования cookies: privacy@nashlo.ru</p>
        </section>
      </div>
      <div className="mt-10 flex flex-wrap gap-4 text-xs text-zinc-400">
        <Link href="/terms" className="underline underline-offset-2 hover:text-zinc-700">Пользовательское соглашение</Link>
        <Link href="/privacy" className="underline underline-offset-2 hover:text-zinc-700">Политика конфиденциальности</Link>
        <Link href="/personal-data" className="underline underline-offset-2 hover:text-zinc-700">Персональные данные</Link>
      </div>
    </main>
  )
}
