"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

export function AdminLogoutButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function logout() {
    setLoading(true)
    await fetch("/api/admin/session", { method: "DELETE" })
    router.push("/feed")
    router.refresh()
  }

  return (
    <button
      type="button"
      onClick={logout}
      disabled={loading}
      className="rounded-2xl border border-zinc-200 bg-white px-5 py-3 text-sm font-semibold text-zinc-700 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? "Выходим..." : "Выйти из админки"}
    </button>
  )
}
