import Link from "next/link"
import { CookiePreferencesPanel } from "@/components/legal/CookieBanner"
import { LegalPageShell } from "@/components/legal/LegalPageShell"
import {
  CONTACT_EMAIL_SUPPORT,
  LEGAL_LINKS,
  OWNER_INN,
  OWNER_OGRNIP,
} from "@/lib/legal-meta"

const LAST_UPDATED_AT = "13 мая 2026 г."

export function CookiePolicyDocument() {
  return (
    <LegalPageShell
      title="Политика использования файлов cookie"
      description="Политика использования файлов cookie на сайте Nashlo / Нашло."
    >
      <section>
        <p className="rounded-2xl border border-zinc-100 bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
          Дата последнего обновления: <span className="font-medium text-zinc-950">{LAST_UPDATED_AT}</span>
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-zinc-950">1. Общие положения</h2>
        <p className="mt-3">
          Настоящая Политика использования файлов cookie действует в отношении сайта{" "}
          <a href="https://nashlo.ru" className="underline underline-offset-2">
            nashlo.ru
          </a>{" "}
          и объясняет, как сервис Nashlo / Нашло применяет cookie и схожие технологии для корректной работы сайта,
          сохранения пользовательских настроек и улучшения сервиса.
        </p>
        <p className="mt-3">
          Владельцем сайта является ИП Антонов Александр Сергеевич, ИНН {OWNER_INN}, ОГРНИП {OWNER_OGRNIP}. Политика
          дополняет{" "}
          <Link href={LEGAL_LINKS.privacyPolicy} className="underline underline-offset-2">
            Политику обработки персональных данных
          </Link>{" "}
          и применяется ко всем посетителям сайта.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-zinc-950">2. Что такое cookie</h2>
        <p className="mt-3">
          Cookie представляют собой небольшие текстовые файлы, которые браузер сохраняет на устройстве пользователя при
          посещении сайта. В зависимости от назначения мы также можем использовать локальное хранилище браузера
          (`localStorage`) и иные технически аналогичные механизмы для сохранения настроек и подтверждения действий
          пользователя.
        </p>
        <p className="mt-3">
          Cookie сами по себе не запускают программы и не дают доступ к устройству пользователя, однако в отдельных
          случаях могут быть связаны с данными об аккаунте, сессии или действиях на сайте.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-zinc-950">3. Какие категории cookie мы используем</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>
            <strong className="text-zinc-950">Строго необходимые</strong> — нужны для открытия страниц, входа в аккаунт,
            поддержки сессии, защиты форм, предотвращения злоупотреблений и обеспечения безопасности сайта.
          </li>
          <li>
            <strong className="text-zinc-950">Функциональные</strong> — помогают запоминать выбранные настройки,
            например параметры интерфейса, отображения, фильтры и иные предпочтения пользователя.
          </li>
          <li>
            <strong className="text-zinc-950">Аналитические и статистические</strong> — используются для обезличенной
            оценки посещаемости, понимания востребованности разделов сайта и улучшения стабильности сервиса, если такие
            инструменты подключены в текущей версии сайта.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-base font-semibold text-zinc-950">4. Для каких целей используются cookie</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>обеспечение технической доступности сайта и его основных функций;</li>
          <li>авторизация пользователя и защита активной сессии;</li>
          <li>сохранение пользовательских настроек и предпочтений;</li>
          <li>диагностика ошибок, защита от автоматизированных злоупотреблений и повышение безопасности;</li>
          <li>анализ посещаемости и улучшение качества интерфейса и функциональности сайта.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-base font-semibold text-zinc-950">5. Основания использования и согласие</h2>
        <p className="mt-3">
          Строго необходимые cookie используются, поскольку без них сайт не сможет работать корректно и безопасно.
          Функциональные и аналитические cookie применяются в объёме, необходимом для работы сервиса и улучшения его
          качества.
        </p>
        <p className="mt-3">
          При первом посещении сайта отображается уведомление с выбором: «Принять все» (включая аналитические cookie)
          или «Только необходимые» (без аналитики посещений). Выбор сохраняется в браузере и может быть изменён в
          настройках ниже или на странице политики cookie.
        </p>
        <CookiePreferencesPanel className="mt-4" />
      </section>

      <section>
        <h2 className="text-base font-semibold text-zinc-950">6. Срок хранения cookie</h2>
        <p className="mt-3">
          Часть cookie действует только в течение текущей сессии и удаляется после закрытия браузера. Другая часть
          может храниться дольше, если это необходимо для сохранения настроек, безопасности или стабильной работы
          сайта, но не дольше срока, оправданного соответствующей целью.
        </p>
        <p className="mt-3">
          Данные о подтверждении уведомления о cookie могут храниться до очистки локального хранилища пользователем или
          до сброса данных сайта в браузере.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-zinc-950">7. Передача данных третьим лицам</h2>
        <p className="mt-3">
          В процессе работы сайта Nashlo / Нашло может использовать технических подрядчиков и сервисы, которые помогают
          обеспечивать хостинг, безопасность, доставку контента и аналитику. Если такие инструменты устанавливают
          собственные технические идентификаторы, их использование регулируется также правилами соответствующих
          поставщиков.
        </p>
        <p className="mt-3">
          Мы не продаём cookie-идентификаторы пользователей третьим лицам и стремимся ограничивать объём передаваемых
          технических данных задачами работы сайта.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-zinc-950">8. Как отключить или удалить cookie</h2>
        <p className="mt-3">
          Пользователь может изменить параметры использования cookie в настройках браузера, удалить сохранённые cookie
          или очистить локальное хранилище сайта. Отключение строго необходимых cookie может привести к недоступности
          отдельных функций сайта, включая авторизацию, сохранение настроек и защитные механизмы.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-zinc-950">9. Изменение Политики</h2>
        <p className="mt-3">
          Мы вправе обновлять настоящую Политику при изменении функциональности сайта, состава используемых технологий
          или требований законодательства. Актуальная редакция всегда публикуется по адресу{" "}
          <Link href={LEGAL_LINKS.cookiePolicy} className="underline underline-offset-2">
            /legal/cookie-policy
          </Link>
          .
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-zinc-950">10. Контакты</h2>
        <p className="mt-3">
          По вопросам, связанным с использованием cookie на сайте Nashlo / Нашло, можно обратиться по адресу{" "}
          <a href={`mailto:${CONTACT_EMAIL_SUPPORT}`} className="underline underline-offset-2">
            {CONTACT_EMAIL_SUPPORT}
          </a>
          .
        </p>
      </section>
    </LegalPageShell>
  )
}
