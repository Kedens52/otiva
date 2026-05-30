"use client"

type MapPlaceholderProps = {
  title: string
  description: string
  className?: string
}

export function MapPlaceholder({
  title,
  description,
  className,
}: MapPlaceholderProps) {
  return (
    <div
      className={`flex min-h-[320px] w-full flex-col items-center justify-center rounded-[28px] border border-dashed border-zinc-200 bg-zinc-50 px-6 py-10 text-center ${className ?? ""}`}
    >
      <div className="mb-3 text-4xl">🗺️</div>
      <h3 className="text-lg font-semibold text-zinc-950">{title}</h3>
      <p className="mt-2 max-w-lg text-sm leading-6 text-zinc-500">{description}</p>
    </div>
  )
}
