"use client"

import { useMemo } from "react"
import { DEAL_RISK_DISCLAIMER_RU, messageLooksLikeDealRisk } from "@/lib/chat/deal-risk-keywords"

type Props = { draftText: string; className?: string }

export function ChatFraudHint({ draftText, className = "" }: Props) {
  const show = useMemo(() => messageLooksLikeDealRisk(draftText), [draftText])
  if (!show) return null
  return (
    <p className={`rounded-2xl border border-amber-200/80 bg-amber-50 px-3 py-2 text-xs leading-snug text-amber-950 ${className}`}>
      {DEAL_RISK_DISCLAIMER_RU}
    </p>
  )
}
