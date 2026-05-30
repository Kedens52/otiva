import Link from "next/link"
import { getRelatedLegalDocuments } from "@/lib/legal-documents"

export function LegalRelatedDocuments({ href }: { href: string }) {
  const related = getRelatedLegalDocuments(href)
  if (!related.length) return null

  return (
    <section className="mt-8 rounded-2xl border border-zinc-100 bg-zinc-50/90 p-5 sm:p-6">
      <h2 className="text-base font-semibold text-zinc-950">Связанные документы</h2>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {related.map((doc) => (
          <li key={doc.href}>
            <Link
              href={doc.href}
              className="block rounded-xl border border-zinc-200/80 bg-white px-3 py-2.5 text-sm font-medium text-zinc-800 transition hover:border-[hsl(var(--nashlo-orange)/0.35)] hover:text-[hsl(var(--nashlo-orange))]"
            >
              {doc.title}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
