import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

// Read environment variables directly
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Create a function to get the client
function getSupabaseClient() {
  // Check if variables are available
  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'undefined' || supabaseAnonKey === 'undefined') {
    // In development, show helpful error message
    if (typeof window !== 'undefined') {
      console.error('⚠️ Missing Supabase environment variables!')
      console.error('📝 Please create a .env.local file in the root directory with:')
      console.error('   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co')
      console.error('   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key')
      console.error('   Get these from: https://app.supabase.com/project/_/settings/api')
      console.error('   See ENV_SETUP.md for detailed instructions')
      console.error('   ⚠️ IMPORTANT: Restart the dev server after creating .env.local!')
      console.error('   Current values:', { 
        url: supabaseUrl || 'NOT SET', 
        key: supabaseAnonKey ? 'SET (hidden)' : 'NOT SET' 
      })
    }
    
    // Return a placeholder client that will fail gracefully
    // Use 'any' type to avoid TypeScript inference issues
    return createClient<any>('https://placeholder.supabase.co', 'placeholder-key', {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    }) as any
  }

  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  })
}

export const supabase = getSupabaseClient()

