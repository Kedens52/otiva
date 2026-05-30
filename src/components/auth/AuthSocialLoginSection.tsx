"use client"

import { AuthPhonePauseNotice } from "@/components/auth/AuthPhonePauseNotice"
import { OAuthLoginButtons } from "@/components/auth/OAuthLoginButtons"

type AuthSocialLoginSectionProps = {
  redirectTo: string
  onAuthSuccess?: () => void
  onAuthError?: (message: string) => void
  onBusyChange?: (busy: boolean) => void
  className?: string
}

export function AuthSocialLoginSection({
  redirectTo,
  onAuthSuccess,
  onAuthError,
  onBusyChange,
  className = "",
}: AuthSocialLoginSectionProps) {
  return (
    <div className={className}>
      <AuthPhonePauseNotice className="mb-4" />
      <OAuthLoginButtons
        redirectTo={redirectTo}
        onBusyChange={onBusyChange}
        onAuthSuccess={onAuthSuccess}
        onAuthError={onAuthError}
      />
    </div>
  )
}
