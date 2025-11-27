import { supabase } from '@/lib/supabase/client'
import { Database } from '@/types/database'
import { OfferWithCategory } from './offers'

type Favorite = Database['public']['Tables']['favorites']['Row']

export interface FavoriteWithOffer extends Favorite {
  offer: OfferWithCategory
}

export async function getUserFavorites(): Promise<FavoriteWithOffer[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('favorites')
      .select(`
        *,
        offer:offers(
          *,
          category:categories(id, name, slug, emoji)
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return (data || []) as FavoriteWithOffer[]
  } catch (error) {
    console.error('Error fetching favorites:', error)
    return []
  }
}

export async function toggleFavorite(offerId: string): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Check if already favorited
    const { data: existing } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('offer_id', offerId)
      .single()

    if (existing) {
      // Remove from favorites
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('offer_id', offerId)

      if (error) throw error
      return false
    } else {
      // Add to favorites
      const { error } = await supabase
        .from('favorites')
        .insert({
          user_id: user.id,
          offer_id: offerId,
        })

      if (error) throw error
      return true
    }
  } catch (error) {
    console.error('Error toggling favorite:', error)
    throw error
  }
}

export async function isFavorite(offerId: string): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const { data, error } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('offer_id', offerId)
      .single()

    if (error && error.code !== 'PGRST116') throw error

    return !!data
  } catch (error) {
    console.error('Error checking favorite:', error)
    return false
  }
}

export async function updateFavoriteNotes(offerId: string, notes: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { error } = await supabase
      .from('favorites')
      .update({ personal_notes: notes })
      .eq('user_id', user.id)
      .eq('offer_id', offerId)

    if (error) throw error
  } catch (error) {
    console.error('Error updating favorite notes:', error)
    throw error
  }
}


