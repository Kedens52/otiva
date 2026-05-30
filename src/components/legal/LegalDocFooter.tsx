import {
  LEGAL_DOCUMENT_VERSION,
  LEGAL_PUBLISHED_DATE_RU,
} from "@/lib/legal-meta"

export function LegalDocFooter() {
  return (
    <footer className="mt-12 border-t border-zinc-100 pt-6 text-xs text-zinc-400">
      <p>Дата публикации: {LEGAL_PUBLISHED_DATE_RU}</p>
      <p className="mt-1">Версия документа: {LEGAL_DOCUMENT_VERSION}</p>
    </footer>
  )
}
