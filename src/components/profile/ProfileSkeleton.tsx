export function ProfileSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 rounded-2xl bg-zinc-200" />
        <div className="flex-1 space-y-2">
          <div className="h-5 w-40 rounded-xl bg-zinc-200" />
          <div className="h-4 w-24 rounded-xl bg-zinc-100" />
        </div>
      </div>
      {[1,2,3].map((i) => (
        <div key={i} className="h-24 rounded-[20px] bg-zinc-100" />
      ))}
    </div>
  )
}
