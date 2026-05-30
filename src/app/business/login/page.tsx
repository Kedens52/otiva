"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { LoginModal } from "@/components/auth/LoginModal"

export default function BusinessLoginPage() {
  const router = useRouter()
  const [open, setOpen] = useState(true)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    fetch("/api/business/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.hasBusinessProfile) {
          router.replace("/business/dashboard")
        } else if (data?.user) {
          router.replace("/business/register")
        }
      })
      .finally(() => setChecking(false))
  }, [router])

  if (checking) {
    return <p className="text-center text-sm text-zinc-500">Загрузка…</p>
  }

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h1 className="text-xl font-bold text-zinc-950">Вход в Нашло Бизнес</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Войдите, чтобы управлять компанией, B2B-объявлениями, заявками и сообщениями. Используйте тот же
        аккаунт: телефон, VK ID или Яндекс ID.
      </p>
      <LoginModal open={open} onClose={() => setOpen(false)} redirectTo="/business/dashboard" />
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-4 w-full rounded-xl bg-[hsl(var(--nashlo-orange))] py-3 text-sm font-semibold text-white"
        >
          Войти
        </button>
      )}
      <Link
        href="/business/register"
        className="mt-4 flex w-full items-center justify-center rounded-xl border border-zinc-200 py-3 text-sm font-semibold text-zinc-800"
      >
        Зарегистрировать бизнес
      </Link>
      <p className="mt-6 text-center text-sm text-zinc-500">
        <Link href="/login" className="text-zinc-600 hover:underline">
          Обычный вход на Нашло
        </Link>
      </p>
    </div>
  )
}
