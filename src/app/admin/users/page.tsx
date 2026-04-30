const users = ["Алексей Морозов", "Марина Волкова", "Илья Соколов", "Анна Павлова"]

export default function AdminUsersPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="text-4xl font-semibold tracking-tight text-zinc-950">Пользователи</h1>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {users.map((user) => (
          <div key={user} className="flex items-center justify-between rounded-[24px] border border-zinc-200 bg-white p-5 shadow-sm">
            <div>
              <p className="font-semibold text-zinc-950">{user}</p>
              <p className="text-sm text-zinc-500">Проверенный профиль</p>
            </div>
            <button className="rounded-full bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-700">Открыть</button>
          </div>
        ))}
      </div>
    </main>
  )
}
