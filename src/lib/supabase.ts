import { createBrowserClient } from "@supabase/ssr"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export function isSupabaseConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_KEY)
}

export function createClient() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    // Return a no-op stub so the app works without Supabase configured
    return {
      auth: {
        getUser: async () => ({ data: { user: null }, error: null }),
        signInWithPassword: async ({ email }: { email: string; password: string }) => {
          if (typeof window !== "undefined") {
            localStorage.setItem("nashlo-demo-user", JSON.stringify({
              name: email.split("@")[0] || "Пользователь",
              email,
              phone: "",
              avatar: "",
            }))
            window.dispatchEvent(new Event("nashlo-auth-change"))
          }
          return { data: { user: { id: "demo-user", email } }, error: null }
        },
        signUp: async ({ email, options }: { email: string; password: string; options?: { data?: { name?: string } } }) => {
          if (typeof window !== "undefined") {
            localStorage.setItem("nashlo-demo-user", JSON.stringify({
              name: options?.data?.name || email.split("@")[0] || "Пользователь",
              email,
              phone: "",
              avatar: "",
            }))
            window.dispatchEvent(new Event("nashlo-auth-change"))
          }
          return { data: { user: { id: "demo-user", email } }, error: null }
        },
        resetPasswordForEmail: async () => ({ data: {}, error: null }),
        signOut: async () => {},
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      },
      from: () => ({
        select: () => ({ eq: () => ({ single: async () => ({ data: null, error: null }), data: null, error: null }) }),
        insert: async () => ({ data: null, error: null }),
        upsert: async () => ({ data: null, error: null }),
        update: () => ({ eq: async () => ({ data: null, error: null }) }),
        delete: () => ({ eq: async () => ({ data: null, error: null }) }),
      }),
    } as unknown as ReturnType<typeof createBrowserClient>
  }

  return createBrowserClient(SUPABASE_URL, SUPABASE_KEY)
}

// Singleton for use in client components
let _client: ReturnType<typeof createClient> | null = null
export function getSupabase() {
  if (!_client) _client = createClient()
  return _client
}
