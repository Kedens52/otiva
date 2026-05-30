"use client"

import Image from "next/image"
import { useRef, useState } from "react"
import { Upload } from "lucide-react"

type Props = {
  label: string
  value: string | null
  onChange: (url: string) => void
  aspect?: "square" | "wide"
}

export function BusinessImageUpload({ label, value, onChange, aspect = "square" }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")

  async function onFile(file: File) {
    setError("")
    setUploading(true)
    const fd = new FormData()
    fd.append("file", file)
    fd.append("type", "image")
    const res = await fetch("/api/upload", { method: "POST", body: fd })
    const data = await res.json().catch(() => ({}))
    setUploading(false)
    if (!res.ok) {
      setError(data.error ?? "Ошибка загрузки")
      return
    }
    if (data.url) onChange(data.url)
  }

  return (
    <div>
      <p className="text-sm font-medium text-zinc-700">{label}</p>
      <div
        className={`relative mt-2 overflow-hidden rounded-xl border border-dashed border-zinc-300 bg-zinc-50 ${
          aspect === "wide" ? "aspect-[3/1] w-full" : "h-24 w-24"
        }`}
      >
        {value ? (
          <Image src={value} alt="" fill className="object-cover" sizes="200px" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-zinc-400">
            <Upload className="h-6 w-6" />
          </div>
        )}
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="absolute inset-0 flex items-center justify-center bg-black/0 text-xs font-semibold text-white transition hover:bg-black/40"
        >
          {uploading ? "…" : value ? "Заменить" : "Загрузить"}
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) void onFile(f)
        }}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}
