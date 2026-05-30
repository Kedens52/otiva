"use client"



import { useEffect, useState } from "react"

import { usePathname, useRouter } from "next/navigation"

import { AuthSocialLoginSection } from "@/components/auth/AuthSocialLoginSection"
import { LEGAL_LINKS } from "@/lib/legal-meta"
import Link from "next/link"
import { Logo } from "@/components/layout/Logo"



interface LoginModalProps {

  open: boolean

  onClose: () => void

  redirectTo?: string

}



export function LoginModal({ open, onClose, redirectTo }: LoginModalProps) {

  const router = useRouter()

  const pathname = usePathname()

  const returnTo = redirectTo ?? pathname ?? "/profile"



  const [step, setStep] = useState<"phone" | "name">("phone")

  const [name, setName] = useState("")

  const [loading, setLoading] = useState(false)

  const [oauthBusy, setOauthBusy] = useState(false)

  const [error, setError] = useState("")
  const [oauthError, setOauthError] = useState("")



  useEffect(() => {

    function onKey(e: KeyboardEvent) {

      if (e.key === "Escape" && !oauthBusy) onClose()

    }

    document.addEventListener("keydown", onKey)

    return () => document.removeEventListener("keydown", onKey)

  }, [onClose, oauthBusy])



  useEffect(() => {

    if (open) document.body.style.overflow = "hidden"

    else document.body.style.overflow = ""

    return () => {

      document.body.style.overflow = ""

    }

  }, [open])



  useEffect(() => {

    if (open) return

    setStep("phone")

    setName("")

    setLoading(false)

    setOauthBusy(false)

    setError("")

    setOauthError("")

  }, [open])



  if (!open) return null



  return (

    <div className="fixed inset-0 z-50 flex items-end justify-center px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-[calc(env(safe-area-inset-top)+0.75rem)] sm:items-center sm:p-4">

      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !oauthBusy && onClose()} />



      <div className="relative z-10 max-h-[calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-1.5rem)] w-full max-w-[420px] overflow-y-auto rounded-3xl bg-white shadow-2xl">

        <button

          type="button"

          onClick={onClose}

          disabled={oauthBusy}

          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 hover:bg-zinc-200 disabled:opacity-50"

          aria-label="Закрыть"

        >

          ✕

        </button>



        <div className="px-7 pt-7 pb-6">
          <div className="mb-5 flex justify-center">
            <Logo size="default" />
          </div>
          <h2 className="text-2xl font-bold text-zinc-950">Вход</h2>



          {step === "name" ? (

            <form

              onSubmit={async (e) => {

                e.preventDefault()

                if (name.trim().length < 2) {

                  setError("Введите имя (минимум 2 символа)")

                  return

                }

                setLoading(true)

                await fetch("/api/auth/me", {

                  method: "PATCH",

                  headers: { "Content-Type": "application/json" },

                  body: JSON.stringify({ name: name.trim() }),

                })

                setLoading(false)

                window.dispatchEvent(new Event("nashlo-auth-change"))

                onClose()

                router.refresh()

              }}

              className="mt-5 space-y-3"

            >

              <p className="text-sm text-zinc-500">Как вас зовут?</p>

              <input

                type="text"

                value={name}

                onChange={(e) => setName(e.target.value)}

                placeholder="Ваше имя"

                className="h-13 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 text-sm outline-none transition focus:border-blue-400 focus:bg-white"

                autoFocus

              />

              {error && <p className="text-sm text-red-500">{error}</p>}

              <button

                type="submit"

                disabled={loading}

                className="h-12 w-full rounded-2xl bg-blue-500 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:opacity-50"

              >

                {loading ? "Сохраняем…" : "Продолжить"}

              </button>

            </form>

          ) : (
            <div className="mt-5">
              <p className="mb-4 text-sm text-zinc-500">Войдите через VK или Яндекс ID</p>
              {(oauthError || error) ? (
                <p className="mb-4 text-sm text-red-500">{oauthError || error}</p>
              ) : null}
              <AuthSocialLoginSection
                redirectTo={returnTo}
                onBusyChange={setOauthBusy}
                onAuthSuccess={() => {
                  onClose()
                  router.refresh()
                }}
                onAuthError={setOauthError}
              />
              <p className="mt-5 text-xs leading-relaxed text-zinc-400">
                Входя, вы принимаете{" "}
                <Link href={LEGAL_LINKS.userAgreement} className="underline hover:text-zinc-700">
                  условия использования
                </Link>
                ,{" "}
                <Link href={LEGAL_LINKS.privacyPolicy} className="underline hover:text-zinc-700">
                  политику конфиденциальности
                </Link>{" "}
                и даёте{" "}
                <Link href={LEGAL_LINKS.personalDataConsent} className="underline hover:text-zinc-700">
                  согласие на обработку персональных данных
                </Link>
                .
              </p>
            </div>
          )}

        </div>

      </div>

    </div>

  )

}


