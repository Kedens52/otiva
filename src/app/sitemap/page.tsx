import Link from "next/link"
import { LegalStandaloneShell } from "@/components/legal/LegalStandaloneShell"
import { LEGAL_DOCUMENT_INDEX } from "@/lib/legal-meta"
import { loadWantToBuyCategories } from "@/lib/want-to-buy/categories"
import { getWantToBuyHubPath, getWantToBuySearchPath, getWantToBuyCategoriesPath, getWantToBuyCategoryPath } from "@/lib/want-to-buy/routes"
import { MARKETPLACE_CATEGORIES } from "@/config/marketplace-categories"
import { marketplaceCategoryNavLinks, businessPublicNavLinks } from "@/lib/seo/sitemap-nav-links"

const MAIN_LINKS = [
  { href: "/", label: "Главная" },
  { href: "/categories", label: "Категории объявлений" },
  { href: getWantToBuyHubPath(), label: "Куплю" },
  { href: getWantToBuySearchPath(), label: "Поиск заявок Куплю" },
  { href: getWantToBuyCategoriesPath(), label: "Категории Куплю" },
  { href: "/pricing", label: "Тарифы" },
  { href: "/help", label: "Помощь" },
  { href: "/about", label: "О сервисе" },
  { href: "/safety", label: "Безопасность" },
  { href: "/advertising", label: "Реклама" },
] as const

const XML_SITEMAPS = [
  { href: "/sitemap.xml", label: "Индекс sitemap" },
  { href: "/sitemap-static.xml", label: "Статические страницы" },
  { href: "/sitemap-categories.xml", label: "Категории" },
  { href: "/sitemap-cities.xml", label: "Города" },
  { href: "/sitemap-listings.xml", label: "Объявления" },
  { href: "/sitemap-want-to-buy.xml", label: "Куплю" },
  { href: "/sitemap-sellers.xml", label: "Продавцы" },
  { href: "/sitemap-business.xml", label: "Нашло Бизнес" },
] as const

function categoryLinks() {
  return marketplaceCategoryNavLinks()
}

async function wantToBuyCategoryLinks() {
  const categories = await loadWantToBuyCategories()
  return categories.map((cat) => {
    const meta = MARKETPLACE_CATEGORIES.find((m) => m.slug === cat.slug)
    return {
      href: getWantToBuyCategoryPath(cat.slug),
      label: `Куплю — ${meta?.title ?? cat.nameRu}`,
    }
  })
}

export default async function SitemapPage() {
  const categories = categoryLinks()
  const kypluCategories = await wantToBuyCategoryLinks()
  const businessLinks = businessPublicNavLinks()
  const legalLinks = LEGAL_DOCUMENT_INDEX.flatMap((group) => group.items)

  return (
    <LegalStandaloneShell wide>
      <h1 className="text-4xl font-semibold tracking-tight text-zinc-950 sm:text-5xl">
        Карта сайта
      </h1>
      <p className="mt-3 max-w-2xl text-sm text-zinc-500">
        Основные разделы Nashlo и ссылки на XML-карты для поисковых систем.
      </p>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-zinc-950">Разделы</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          {MAIN_LINKS.map((link) => (
            <SitemapLink key={link.href} {...link} />
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-zinc-950">Категории объявлений</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          {categories.map((link) => (
            <SitemapLink key={link.href} {...link} />
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-zinc-950">Куплю — категории</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          {kypluCategories.map((link) => (
            <SitemapLink key={link.href} {...link} />
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-zinc-950">Нашло Бизнес</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          {businessLinks.map((link) => (
            <SitemapLink key={link.href} {...link} />
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-zinc-950">XML sitemap</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {XML_SITEMAPS.map((link) => (
            <SitemapLink key={link.href} {...link} />
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-zinc-950">Правовые документы</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          <SitemapLink href="/legal" label="Все документы" />
          {legalLinks.map((link) => (
            <SitemapLink key={link.href} href={link.href} label={link.label} />
          ))}
        </div>
      </section>
    </LegalStandaloneShell>
  )
}

function SitemapLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-700 transition hover:border-zinc-950 hover:text-zinc-950"
    >
      {label}
    </Link>
  )
}
