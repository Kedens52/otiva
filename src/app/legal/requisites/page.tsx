import type { Metadata } from "next"
import { LegalPageShell } from "@/components/legal/LegalPageShell"
import {
  BANK_DETAILS,
  OWNER_INN,
  OWNER_LEGAL_NAME,
  OWNER_OGRNIP,
} from "@/lib/legal-meta"
import { buildPageMetadata } from "@/lib/seo/site"

export const metadata: Metadata = buildPageMetadata({
  title: "Реквизиты — Нашло",
  description: "Реквизиты владельца сервиса Нашло.",
  path: "/legal/requisites",
})

export default function RequisitesPage() {
  return (
    <LegalPageShell title="Реквизиты владельца сайта">
      <section>
        <p className="font-medium text-zinc-950">{OWNER_LEGAL_NAME}</p>
        <dl className="mt-4 space-y-3">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-400">ИНН</dt>
            <dd className="mt-1">{OWNER_INN}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-400">ОГРНИП</dt>
            <dd className="mt-1">{OWNER_OGRNIP}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Расчётный счёт</dt>
            <dd className="mt-1">{BANK_DETAILS.account}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Банк</dt>
            <dd className="mt-1">{BANK_DETAILS.bankName}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-400">БИК банка</dt>
            <dd className="mt-1">{BANK_DETAILS.bik}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-400">ИНН банка</dt>
            <dd className="mt-1">{BANK_DETAILS.bankInn}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Корреспондентский счёт банка</dt>
            <dd className="mt-1">{BANK_DETAILS.correspondentAccount}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Юридический адрес банка</dt>
            <dd className="mt-1">{BANK_DETAILS.bankLegalAddress}</dd>
          </div>
        </dl>
      </section>
    </LegalPageShell>
  )
}
