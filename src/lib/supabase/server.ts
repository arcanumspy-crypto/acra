import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/types/database'

export async function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }

  const cookieStore = await cookies()

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options })
        } catch (error) {
          // The `set` method was called from a Server Component or Route Handler.
          // This can be ignored in API routes
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: '', ...options })
        } catch (error) {
          // The `delete` method was called from a Server Component or Route Handler.
          // This can be ignored in API routes
        }
      },
    },
  })
}

// Admin client is now exported from @/lib/supabase/admin
// Import it from there to avoid bundling next/headers in client code
export { createAdminClient } from './admin'


