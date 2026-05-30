"use client"

const inputClass =
  "mt-2 h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm outline-none focus:border-[hsl(var(--nashlo-orange))] focus:bg-white"
const inputErrorClass = inputClass + " border-red-300 bg-red-50/40"

export function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="mt-1.5 text-xs text-red-600">{message}</p>
}

export function ProfileTextField({
  label,
  value,
  onChange,
  error,
  placeholder,
  hint,
  maxLength,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  error?: string
  placeholder?: string
  hint?: string
  maxLength?: number
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-zinc-600">{label}</span>
      {hint ? <span className="mt-0.5 block text-xs text-zinc-400">{hint}</span> : null}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className={error ? inputErrorClass : inputClass}
      />
      <FieldError message={error} />
    </label>
  )
}

export function ProfileTextareaField({
  label,
  value,
  onChange,
  error,
  placeholder,
  hint,
  maxLength = 500,
  rows = 4,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  error?: string
  placeholder?: string
  hint?: string
  maxLength?: number
  rows?: number
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-zinc-600">{label}</span>
      {hint ? <p className="mt-1 text-xs leading-relaxed text-zinc-400">{hint}</p> : null}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        className={
          (error ? "border-red-300 bg-red-50/40 " : "border-zinc-200 bg-zinc-50 ") +
          "mt-2 w-full resize-none rounded-2xl border p-4 text-sm leading-6 outline-none focus:border-[hsl(var(--nashlo-orange))] focus:bg-white"
        }
      />
      <div className="mt-1 flex justify-between gap-2">
        <FieldError message={error} />
        <span className="ml-auto text-xs text-zinc-400">
          {value.length}/{maxLength}
        </span>
      </div>
    </label>
  )
}

export function PrivacySwitch({
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  label: string
  description?: string
  checked: boolean
  disabled?: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-100 bg-zinc-50/80 px-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-zinc-900">{label}</p>
        {description ? <p className="text-xs text-zinc-500">{description}</p> : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={
          "relative h-7 w-12 shrink-0 rounded-full transition " +
          (checked ? "bg-[hsl(var(--nashlo-orange))]" : "bg-zinc-300") +
          (disabled ? " opacity-40" : "")
        }
      >
        <span
          className={
            "absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition " +
            (checked ? "left-[22px]" : "left-0.5")
          }
        />
      </button>
    </div>
  )
}
