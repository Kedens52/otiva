"use client"

import { SupportChat } from "@/components/support/SupportChat"

export default function SupportPage() {
  return (
    <main className="flex min-h-0 flex-1 bg-[#F5F6F7] text-zinc-950">
      <div className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col lg:px-6 lg:py-6">
        <SupportChat showBackLink backHref="/chat" />
      </div>
    </main>
  )
}
