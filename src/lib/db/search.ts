import { supabase } from '@/lib/supabase/client'
import { OfferFilters } from './offers'

export async function saveSearch(query: string, filters?: OfferFilters) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('search_history')
      .insert({
        user_id: user.id,
        query,
        filters: filters as any,
      })

    if (error) throw error
  } catch (error) {
    console.error('Error saving search:', error)
  }
}

export async function deleteSearch(searchId: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('search_history')
      .delete()
      .eq('id', searchId)
      .eq('user_id', user.id)

    if (error) throw error
  } catch (error) {
    console.error('Error deleting search:', error)
    throw error
  }
}


