"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

// Cars detail page redirects to unified listing page
export default function CarDetailRedirect({ params }: { params: { id: string } }) {
  const router = useRouter()
  useEffect(() => { router.replace(`/listings/${params.id}`) }, [router, params.id])
  return <div className="mx-auto max-w-7xl px-4 py-20 text-center text-sm text-zinc-400">Загрузка…</div>
}
