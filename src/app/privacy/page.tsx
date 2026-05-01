import Link from "next/link"

export const metadata = { title: "Политика конфиденциальности — Нашло" }

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 pb-28 lg:pb-12">
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">Политика конфиденциальности</h1>
      <p className="mt-2 text-sm text-zinc-500">Редакция от 1 января 2025 г. Действует в соответствии с Федеральным законом от 27.07.2006 № 152-ФЗ «О персональных данных».</p>
      <div className="mt-8 space-y-8 text-sm leading-7 text-zinc-700">
        <section>
          <h2 className="text-base font-semibold text-zinc-950">1. Кто мы</h2>
          <p className="mt-3">Оператором персональных данных является ООО «Нашло» (далее — Оператор). Настоящая Политика описывает, какие данные мы собираем, как используем и как защищаем персональные данные пользователей сайта nashlo.ru.</p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-zinc-950">2. Какие данные мы собираем</h2>
          <p className="mt-3">При регистрации и использовании сервиса мы можем собирать: имя и фамилию; адрес электронной почты; номер телефона; город проживания; IP-адрес и данные браузера; историю объявлений и переписки; данные платёжных транзакций (без номеров карт — передаются напрямую платёжным системам); cookies и аналитические данные о поведении на сайте.</p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-zinc-950">3. Цели обработки данных</h2>
          <p className="mt-3">Мы обрабатываем персональные данные для: регистрации и идентификации пользователя; обеспечения работы сервиса и личного кабинета; обработки объявлений и сообщений; отправки уведомлений и технических сообщений; предотвращения мошенничества и обеспечения безопасности; улучшения качества сервиса и пользовательского опыта; исполнения требований законодательства РФ.</p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-zinc-950">4. Правовые основания</h2>
          <p className="mt-3">Обработка персональных данных осуществляется на основании: согласия пользователя (ст. 6 152-ФЗ); исполнения договора, стороной которого является пользователь; исполнения обязанностей Оператора, предусмотренных законодательством РФ.</p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-zinc-950">5. Передача данных третьим лицам</h2>
          <p className="mt-3">Мы не продаём и не передаём персональные данные третьим лицам, за исключением: платёжных систем для проведения транзакций; облачных сервисов хранения данных (Supabase, серверы в ЕС); аналитических сервисов в обезличенном виде; органов государственной власти по их законным запросам. Все партнёры обязаны соблюдать конфиденциальность данных.</p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-zinc-950">6. Хранение и защита данных</h2>
          <p className="mt-3">Данные хранятся на защищённых серверах с шифрованием. Срок хранения: в период действия аккаунта и 3 года после его удаления. Мы применяем технические и организационные меры для защиты данных от несанкционированного доступа, изменения и уничтожения.</p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-zinc-950">7. Права пользователя</h2>
          <p className="mt-3">В соответствии с 152-ФЗ вы вправе: получить информацию об обработке ваших данных; потребовать исправления неточных данных; потребовать удаления данных («право на забвение»); отозвать согласие на обработку данных; обратиться с жалобой в Роскомнадзор (rkn.gov.ru). Для реализации прав направьте запрос на privacy@nashlo.ru.</p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-zinc-950">8. Cookies</h2>
          <p className="mt-3">Сайт использует файлы cookie. Подробнее — в <Link href="/cookies" className="underline underline-offset-2 hover:text-zinc-950">Политике использования cookies</Link>.</p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-zinc-950">9. Изменения политики</h2>
          <p className="mt-3">Мы можем обновлять настоящую Политику. При существенных изменениях уведомим пользователей через сайт или email. Продолжение использования сервиса после изменений означает согласие с новой редакцией.</p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-zinc-950">10. Контакты</h2>
          <p className="mt-3">По вопросам обработки персональных данных: privacy@nashlo.ru. Срок ответа — 30 дней.</p>
        </section>
      </div>
      <div className="mt-10 flex flex-wrap gap-4 text-xs text-zinc-400">
        <Link href="/terms" className="underline underline-offset-2 hover:text-zinc-700">Пользовательское соглашение</Link>
        <Link href="/personal-data" className="underline underline-offset-2 hover:text-zinc-700">Персональные данные</Link>
        <Link href="/cookies" className="underline underline-offset-2 hover:text-zinc-700">Cookies</Link>
      </div>
    </main>
  )
}
