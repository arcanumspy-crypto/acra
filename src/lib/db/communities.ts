import { supabase } from '@/lib/supabase/client'
import { Database } from '@/types/database'

type Community = Database['public']['Tables']['communities']['Row']
type CommunityInsert = Database['public']['Tables']['communities']['Insert']
type CommunityUpdate = Database['public']['Tables']['communities']['Update']

export interface CommunityWithStats extends Community {
  member_count?: number
}

/**
 * Get active communities for user (with member count)
 */
export async function getActiveCommunitiesForUser(): Promise<CommunityWithStats[]> {
  try {
    const { data: communities, error: communitiesError } = await supabase
      .from('communities')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (communitiesError) {
      // Se a tabela não existir, retornar array vazio (não quebrar)
      if (communitiesError.code === '42P01' || communitiesError.code === 'PGRST202' || 
          communitiesError.message?.includes('does not exist') ||
          communitiesError.message?.includes('schema cache')) {
        console.warn('⚠️ [getActiveCommunitiesForUser] Tabela communities não existe. Execute a migration 025_create_communities_tables.sql')
        return []
      }
      throw communitiesError
    }

    // Se não houver comunidades, retornar array vazio
    if (!communities || communities.length === 0) {
      return []
    }

    // Get member counts for each community (com tratamento de erro individual)
    const communitiesWithStats = await Promise.all(
      communities.map(async (community) => {
        try {
          const { count, error: countError } = await supabase
            .from('community_members')
            .select('*', { count: 'exact', head: true })
            .eq('community_id', community.id)

          // Se houver erro ao contar (tabela não existe), usar 0
          if (countError) {
            console.warn(`⚠️ [getActiveCommunitiesForUser] Erro ao contar membros:`, countError.message)
            return {
              ...community,
              member_count: 0,
            } as CommunityWithStats
          }

          return {
            ...community,
            member_count: count || 0,
          } as CommunityWithStats
        } catch (memberError: any) {
          console.warn(`⚠️ [getActiveCommunitiesForUser] Erro ao processar comunidade ${community.id}:`, memberError.message)
          return {
            ...community,
            member_count: 0,
          } as CommunityWithStats
        }
      })
    )

    return communitiesWithStats
  } catch (error: any) {
    console.error('❌ [getActiveCommunitiesForUser] Erro ao buscar comunidades:', error)
    // Sempre retornar array vazio para não quebrar a página
    return []
  }
}

/**
 * User joins a community
 * Se a comunidade for paga (is_paid = true), debita 120 créditos por mês
 */
export async function joinCommunity(userId: string, communityId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Verificar se a comunidade existe e se é paga
    const { data: community, error: communityError } = await supabase
      .from('communities')
      .select('is_paid, is_active')
      .eq('id', communityId)
      .single()

    if (communityError || !community) {
      throw new Error('Comunidade não encontrada')
    }

    if (!community.is_active) {
      throw new Error('Esta comunidade não está ativa')
    }

    // Se a comunidade for paga, verificar saldo e debitar créditos via API
    if (community.is_paid) {
      const creditsRequired = 120 // 120 créditos por mês
      
      // Verificar saldo via API (evita importar server client)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        return {
          success: false,
          error: 'Você precisa estar autenticado para entrar em uma comunidade paga'
        }
      }

      // Buscar saldo via API
      const balanceResponse = await fetch('/api/credits', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        credentials: 'include',
      })

      if (!balanceResponse.ok) {
        return {
          success: false,
          error: 'Erro ao verificar saldo de créditos'
        }
      }

      const balanceData = await balanceResponse.json()
      const balance = balanceData.balance?.balance || balanceData.balance || 0

      if (balance < creditsRequired) {
        return {
          success: false,
          error: `Saldo insuficiente. Você precisa de ${creditsRequired} créditos para acessar esta comunidade. Seu saldo atual: ${balance} créditos.`
        }
      }

      // Verificar se já é membro (para não debitar créditos novamente)
      const { data: existingMember } = await supabase
        .from('community_members')
        .select('id, joined_at')
        .eq('user_id', userId)
        .eq('community_id', communityId)
        .single()

      // Se não for membro, ou se a última assinatura foi há mais de 30 dias, debitar créditos
      const shouldCharge = !existingMember || (() => {
        if (!existingMember.joined_at) return true
        const joinedDate = new Date(existingMember.joined_at)
        const now = new Date()
        const daysSinceJoined = (now.getTime() - joinedDate.getTime()) / (1000 * 60 * 60 * 24)
        return daysSinceJoined >= 30 // Renovar a cada 30 dias
      })()

      if (shouldCharge) {
        // Debitar créditos via API (evita importar server client)
        const debitResponse = await fetch('/api/credits/debit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          credentials: 'include',
          body: JSON.stringify({
            amount: creditsRequired,
            category: 'offer_view', // Usar categoria válida (a API aceita qualquer string, mas usar uma válida)
            description: `Acesso à comunidade por 1 mês`,
            metadata: {
              community_id: communityId,
              period_days: 30,
              type: 'community_access',
            },
          }),
        })

        if (!debitResponse.ok) {
          const errorData = await debitResponse.json()
          return {
            success: false,
            error: errorData.error || 'Erro ao debitar créditos'
          }
        }
      }
    }

    // Adicionar usuário à comunidade (ou atualizar se já for membro)
    const { error } = await supabase
      .from('community_members')
      .upsert({
        user_id: userId,
        community_id: communityId,
        joined_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,community_id'
      })

    if (error) {
      // If already a member, that's okay
      if (error.code === '23505') {
        return { success: true }
      }
      throw error
    }

    return { success: true }
  } catch (error: any) {
    console.error('Error joining community:', error)
    return {
      success: false,
      error: error.message || 'Erro ao entrar na comunidade'
    }
  }
}

/**
 * User leaves a community
 */
export async function leaveCommunity(userId: string, communityId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('community_members')
      .delete()
      .eq('user_id', userId)
      .eq('community_id', communityId)

    if (error) throw error

    return true
  } catch (error) {
    console.error('Error leaving community:', error)
    throw error
  }
}

/**
 * Admin: Get all communities with stats
 */
export async function adminGetAllCommunitiesWithStats(): Promise<CommunityWithStats[]> {
  try {
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const adminClient = createAdminClient()

    const { data: communities, error: communitiesError } = await adminClient
      .from('communities')
      .select('*')
      .order('created_at', { ascending: false })

    if (communitiesError) throw communitiesError

    // Get member counts for each community
    const communitiesWithStats = await Promise.all(
      (communities || []).map(async (community) => {
        const { count } = await adminClient
          .from('community_members')
          .select('*', { count: 'exact', head: true })
          .eq('community_id', community.id)

        return {
          ...community,
          member_count: count || 0,
        } as CommunityWithStats
      })
    )

    return communitiesWithStats
  } catch (error) {
    console.error('Error fetching all communities:', error)
    return []
  }
}

/**
 * Admin: Create community
 */
export async function adminCreateCommunity(community: CommunityInsert): Promise<Community | null> {
  try {
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const adminClient = createAdminClient()

    const { data, error } = await adminClient
      .from('communities')
      .insert(community)
      .select()
      .single()

    if (error) throw error

    return data as Community
  } catch (error) {
    console.error('Error creating community:', error)
    throw error
  }
}

/**
 * Admin: Update community
 */
export async function adminUpdateCommunity(id: string, updates: CommunityUpdate): Promise<Community | null> {
  try {
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const adminClient = createAdminClient()

    const { data, error } = await adminClient
      .from('communities')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return data as Community
  } catch (error) {
    console.error('Error updating community:', error)
    throw error
  }
}

/**
 * Admin: Delete community
 */
export async function adminDeleteCommunity(id: string): Promise<boolean> {
  try {
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const adminClient = createAdminClient()

    // Delete members first (CASCADE should handle this, but being explicit)
    await adminClient
      .from('community_members')
      .delete()
      .eq('community_id', id)

    // Delete community
    const { error } = await adminClient
      .from('communities')
      .delete()
      .eq('id', id)

    if (error) throw error

    return true
  } catch (error) {
    console.error('Error deleting community:', error)
    throw error
  }
}

