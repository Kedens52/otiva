import Link from "next/link"
import { LEGAL_LINKS } from "@/lib/legal-meta"
import { cn } from "@/lib/utils"

type Variant = "listing" | "advertising" | "promotion" | "bonus" | "reviews"

const CONFIG: Record<
  Variant,
  { lead: string; links: { href: string; label: string }[]; joinWord?: string }
> = {
  listing: {
    lead: "Размещая объявление, вы принимаете",
    links: [{ href: LEGAL_LINKS.listingRules, label: "правила размещения объявлений" }],
  },
  advertising: {
    lead: "Создавая рекламу, вы принимаете",
    links: [
      { href: LEGAL_LINKS.advertisingRules, label: "правила размещения рекламы" },
      { href: LEGAL_LINKS.advertisingOffer, label: "оферту на рекламные услуги" },
    ],
    joinWord: "и",
  },
  promotion: {
    lead: "Оплачивая продвижение, вы принимаете",
    links: [{ href: LEGAL_LINKS.promotionOffer, label: "оферту на услуги продвижения объявлений" }],
  },
  bonus: {
    lead: "Используя бонусную программу, вы принимаете",
    links: [{ href: LEGAL_LINKS.bonusRules, label: "правила бонусной программы «Баллы Нашло»" }],
  },
  reviews: {
    lead: "Оставляя отзыв, вы принимаете",
    links: [{ href: LEGAL_LINKS.reviews, label: "правила отзывов" }],
  },
}

export function LegalConsentNotice({
  variant,
  className,
}: {
  variant: Variant
  className?: string
}) {
  const cfg = CONFIG[variant]
  return (
    <p className={cn("text-xs leading-relaxed text-zinc-500", className)}>
      {cfg.lead}{" "}
      {cfg.links.map((link, i) => (
        <span key={link.href}>
          {i > 0 && cfg.joinWord ? ` ${cfg.joinWord} ` : null}
          <Link href={link.href} className="font-medium text-zinc-700 underline underline-offset-2 hover:text-zinc-950">
            {link.label}
          </Link>
        </span>
      ))}
      .
    </p>
  )
}
