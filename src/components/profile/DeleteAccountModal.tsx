"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props { onClose: () => void }

export function DeleteAccountModal({ onClose }: Props) {
  const router  = useRouter()
  const [value, setValue]   = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')

  async function handleDelete() {
    setLoading(true)
    setError('')
    const res = await fetch('/api/profile', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirm: value }),
    })
    setLoading(false)
    if (!res.ok) {
      const d = await res.json()
      setError(d.error ?? 'Ошибка')
      return
    }
    router.replace('/')
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-end justify-center px-4 pb-[env(safe-area-inset-bottom)] sm:items-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative w-full max-w-md rounded-t-[28px] bg-white p-6 shadow-2xl sm:rounded-[28px]" onClick={(e) => e.stopPropagation()}>
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-zinc-200 sm:hidden" />
        <h2 className="text-xl font-bold text-zinc-950">Удалить аккаунт?</h2>
        <p className="mt-2 text-sm leading-6 text-zinc-500">
          Будут удалены данные профиля, объявления и настройки. Сообщения останутся анонимно. Это действие нельзя отменить.
        </p>
        <label className="mt-4 block">
          <span className="text-sm font-medium text-zinc-700">Введите <strong>УДАЛИТЬ</strong> для подтверждения</span>
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="mt-2 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none focus:border-red-300 focus:bg-white"
            placeholder="УДАЛИТЬ"
          />
        </label>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <div className="mt-5 flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-2xl border border-zinc-200 py-3 text-sm font-semibold text-zinc-600">Отмена</button>
          <button
            onClick={handleDelete}
            disabled={value !== 'УДАЛИТЬ' || loading}
            className="flex-1 rounded-2xl bg-red-600 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-40"
          >
            {loading ? 'Удаляем...' : 'Удалить аккаунт'}
          </button>
        </div>
      </div>
    </div>
  )
}
