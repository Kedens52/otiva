"use client"

import { useEffect, useState } from "react"
import { Trash2 } from "lucide-react"
import { BusinessImageUpload } from "@/components/business/BusinessImageUpload"

type Doc = {
  id: string
  title: string
  fileUrl: string
  docType: string
  isPublic: boolean
}

const DOC_TYPES = [
  { value: "CERTIFICATE", label: "Сертификат" },
  { value: "LICENSE", label: "Лицензия" },
  { value: "PRICE_LIST", label: "Прайс-лист" },
  { value: "PRESENTATION", label: "Презентация" },
  { value: "OTHER", label: "Другое" },
]

export function CompanyDocumentsEditor({ companyId }: { companyId: string }) {
  const [items, setItems] = useState<Doc[]>([])
  const [title, setTitle] = useState("")
  const [fileUrl, setFileUrl] = useState("")
  const [docType, setDocType] = useState("OTHER")

  function load() {
    fetch(`/api/business/companies/${companyId}/documents`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setItems(d?.items ?? []))
  }

  useEffect(() => {
    load()
  }, [companyId])

  async function add() {
    if (!title.trim() || !fileUrl) return
    await fetch(`/api/business/companies/${companyId}/documents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, fileUrl, docType, isPublic: false }),
    })
    setTitle("")
    setFileUrl("")
    load()
  }

  async function togglePublic(id: string, isPublic: boolean) {
    await fetch(`/api/business/companies/${companyId}/documents/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublic }),
    })
    load()
  }

  async function remove(id: string) {
    if (!confirm("Удалить документ?")) return
    await fetch(`/api/business/companies/${companyId}/documents/${id}`, { method: "DELETE" })
    load()
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-600">
        Документы видны на витрине только если включены «Показывать документы» в публичности и отмечены как публичные.
      </p>
      <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-4 space-y-3">
        <input
          className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
          placeholder="Название документа"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <select
          className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
          value={docType}
          onChange={(e) => setDocType(e.target.value)}
        >
          {DOC_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <BusinessImageUpload label="Файл (изображение/PDF как URL)" value={fileUrl || null} onChange={setFileUrl} />
        <input
          className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs"
          placeholder="Или вставьте URL файла (PDF)"
          value={fileUrl}
          onChange={(e) => setFileUrl(e.target.value)}
        />
        <button type="button" onClick={() => void add()} className="rounded-xl bg-zinc-950 px-4 py-2 text-sm font-semibold text-white">
          Добавить документ
        </button>
      </div>
      <ul className="divide-y rounded-xl border border-zinc-200 bg-white">
        {items.map((d) => (
          <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
            <div className="min-w-0">
              <p className="font-medium text-zinc-950">{d.title}</p>
              <p className="text-xs text-zinc-500">{d.docType}</p>
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1 text-xs">
                <input type="checkbox" checked={d.isPublic} onChange={(e) => void togglePublic(d.id, e.target.checked)} />
                Публично
              </label>
              <button type="button" onClick={() => void remove(d.id)} className="text-zinc-400 hover:text-red-600">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
