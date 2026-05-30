import Link from "next/link"
import { PlusCircle } from "lucide-react"
import { Logo } from "@/components/layout/Logo"
import { FooterNavGroups } from "@/components/layout/FooterNavGroups"
import { PAGE_CONTAINER_CLASS } from "@/components/layout/PageContainer"
import { FOOTER_SOCIAL_LINKS } from "@/config/site-nav-links"
import { LEGAL_LINKS, OWNER_INN, OWNER_LEGAL_NAME, OWNER_OGRNIP } from "@/lib/legal-meta"

export function Footer() {
  return (
    <footer className="relative border-t border-zinc-200/90 bg-gradient-to-b from-[#F0F2F5] to-[#ECEEF2]">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[hsl(var(--nashlo-orange)/0.55)] to-transparent"
        aria-hidden
      />

      <div className={`${PAGE_CONTAINER_CLASS} py-7 sm:py-10`}>
        <div className="overflow-hidden rounded-[24px] border border-white/80 bg-white shadow-[0_18px_48px_rgba(15,23,42,0.06)] ring-1 ring-zinc-900/[0.04] sm:rounded-3xl">
          <div
            className="h-1 bg-gradient-to-r from-[hsl(var(--nashlo-orange)/0.12)] via-[hsl(var(--nashlo-orange))] to-[hsl(var(--nashlo-orange)/0.12)]"
            aria-hidden
          />

          <div className="p-4 sm:p-8 lg:p-10">
            {/* Верх + средняя часть */}
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-12">
              {/* Бренд */}
              <div className="shrink-0 lg:w-[min(100%,280px)]">
                <Logo compact />
                <p className="mt-3 text-sm leading-relaxed text-zinc-600">
                  Площадка объявлений по всей России. Находите предложения, общайтесь и договаривайтесь напрямую.
                </p>
                <p className="mt-2 hidden text-sm leading-relaxed text-zinc-500 sm:block">
                  Нашло помогает найти продавца или покупателя, но не является стороной сделки между пользователями.
                </p>

                <Link href="/create" className="nashlo-btn-primary mt-4 inline-flex h-11 w-full justify-center sm:w-auto">
                  <PlusCircle className="h-4 w-4" aria-hidden />
                  Разместить объявление
                </Link>

                <div className="mt-4 flex flex-wrap gap-2">
                  {FOOTER_SOCIAL_LINKS.map((social) => (
                    <a
                      key={social.short}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-10 min-w-10 items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-50 px-3.5 text-sm font-bold text-zinc-700 transition hover:border-[hsl(var(--nashlo-orange)/0.35)] hover:bg-[hsl(var(--nashlo-orange)/0.08)] hover:text-[hsl(var(--nashlo-orange))]"
                      aria-label={social.label}
                    >
                      {social.short}
                    </a>
                  ))}
                </div>
              </div>

              {/* Группы ссылок */}
              <FooterNavGroups />
            </div>

            {/* Нижняя часть */}
            <div className="mt-6 border-t border-zinc-100 pt-5 sm:mt-10 sm:pt-8">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-10">
                <div className="space-y-1.5 text-xs leading-relaxed text-zinc-600 sm:text-sm">
                  <p className="font-semibold text-zinc-800">
                    © ИП Антонов Александр Сергеевич, 2025–2026. Сервис Нашло.
                  </p>
                  <p>
                    {OWNER_LEGAL_NAME}.<br />
                    ИНН {OWNER_INN}, ОГРНИП {OWNER_OGRNIP}.
                  </p>
                </div>

                <p className="max-w-xl text-xs leading-relaxed text-zinc-600 sm:text-sm lg:text-right">
                  Размещая объявление, вы принимаете{" "}
                  <Link
                    href={LEGAL_LINKS.userAgreement}
                    className="font-medium text-zinc-800 underline underline-offset-2 hover:text-[hsl(var(--nashlo-orange))]"
                  >
                    условия использования
                  </Link>{" "}
                  и даёте{" "}
                  <Link
                    href={LEGAL_LINKS.personalDataConsent}
                    className="font-medium text-zinc-800 underline underline-offset-2 hover:text-[hsl(var(--nashlo-orange))]"
                  >
                    согласие на обработку персональных данных
                  </Link>
                  . Используются{" "}
                  <Link
                    href={LEGAL_LINKS.cookiePolicy}
                    className="font-medium text-zinc-800 underline underline-offset-2 hover:text-[hsl(var(--nashlo-orange))]"
                  >
                    cookies
                  </Link>
                  . Информация на сайте не является публичной офертой, кроме случаев, прямо указанных в документах.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
