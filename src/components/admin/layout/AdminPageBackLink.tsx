"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"

type AdminPageBackLinkProps = {
  label: string
  href?: string
  className?: string
}

export function AdminPageBackLink({ label, href, className = "" }: AdminPageBackLinkProps) {
  const router = useRouter()
  const base = "mb-4 inline-flex items-center gap-1 text-sm font-medium text-zinc-500 transition hover:text-zinc-800"

  if (href) {
    return (
      <Link href={href} className={[base, className].join(" ")}>
        ← {label}
      </Link>
    )
  }

  return (
    <button type="button" onClick={() => router.back()} className={[base, className].join(" ")}>
      ← {label}
    </button>
  )
}
