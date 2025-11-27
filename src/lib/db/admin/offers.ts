import { supabase } from '@/lib/supabase/client'
import { Database } from '@/types/database'
import { OfferWithCategory } from '@/lib/db/offers'

type Offer = Database['public']['Tables']['offers']['Row']

export interface OfferWithViews extends OfferWithCategory {
  views_count?: number
}

export async function getTopOffers(limit = 10): Promise<OfferWithViews[]> {
  const startTime = Date.now()
  console.log('⏱️ [Admin Top Offers] Iniciando busca de ofertas mais vistas...')
  
  try {
    // Buscar todas as views e contar por oferta
    const { data: viewsData, error: viewsError } = await supabase
      .from('offer_views')
      .select('offer_id')

    if (viewsError) {
      console.warn('⚠️ [Admin Top Offers] Erro ao buscar views, tentando alternativa:', viewsError)
    }

    // Contar views por oferta
    const viewCounts: Record<string, number> = {}
    viewsData?.forEach(v => {
      if (v.offer_id) {
        viewCounts[v.offer_id] = (viewCounts[v.offer_id] || 0) + 1
      }
    })

    // Ordenar ofertas por número de views (mais vistas primeiro)
    const sortedOfferIds = Object.entries(viewCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([offerId]) => offerId)

    // Buscar detalhes das ofertas mais vistas
    let offersResult
    if (sortedOfferIds.length > 0) {
      // Buscar ofertas específicas que têm mais views
      offersResult = await supabase
        .from('offers')
        .select(`
          *,
          category:categories(id, name, slug, emoji)
        `)
        .in('id', sortedOfferIds)
        .eq('is_active', true)
    } else {
      // Se não houver views, buscar ofertas recentes como fallback
      offersResult = await supabase
        .from('offers')
        .select(`
          *,
          category:categories(id, name, slug, emoji)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(limit)
    }

    if (offersResult.error) throw offersResult.error

    // Mapear ofertas com contagem de views
    const result = (offersResult.data || []).map(offer => ({
      ...offer,
      views_count: viewCounts[offer.id] || 0,
    })) as OfferWithViews[]

    // Ordenar por views (mais vistas primeiro) - garantir ordem correta
    result.sort((a, b) => (b.views_count || 0) - (a.views_count || 0))

    const totalTime = Date.now() - startTime
    console.log(`✅ [Admin Top Offers] ${result.length} ofertas mais vistas carregadas em ${totalTime}ms`, {
      topOffers: result.slice(0, 5).map(o => ({ title: o.title, views: o.views_count }))
    })

    return result.slice(0, limit)
  } catch (error) {
    console.error('❌ [Admin Top Offers] Erro ao buscar ofertas:', error)
    return []
  }
}


