import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

// Admin client (uses service role key - only use in server-side admin routes)
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseServiceKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY. Configure no .env.local e reinicie o servidor.')
  }

  if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL')
  }
  return createSupabaseClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

