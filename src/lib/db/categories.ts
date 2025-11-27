import { supabase } from '@/lib/supabase/client'
import { Database } from '@/types/database'

type Category = Database['public']['Tables']['categories']['Row']

// Cache simples em memória (resetado a cada 5 minutos)
let categoriesCache: { data: Category[]; timestamp: number } | null = null
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutos

export async function getAllCategories(): Promise<Category[]> {
  const startTime = Date.now()
  const timeout = 5000 // Aumentar para 5 segundos
  
  // Verificar cache
  if (categoriesCache && Date.now() - categoriesCache.timestamp < CACHE_DURATION) {
    console.log('✅ [getAllCategories] Usando cache')
    return categoriesCache.data
  }
  
  console.log('⏱️ [getAllCategories] Iniciando busca...')
  
  try {
    // Verificar autenticação primeiro
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError) {
      console.warn('⚠️ [getAllCategories] Erro de autenticação:', authError.message)
    } else {
      console.log(`✅ [getAllCategories] Usuário autenticado: ${user?.id || 'N/A'}`)
    }
    
    const query = supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true })
      .limit(100) // Limite de segurança
    
    console.log('🔍 [getAllCategories] Executando query...')
    const { data, error } = await Promise.race([
      query,
      new Promise<{ data: null; error: { message: string } }>(resolve => 
        setTimeout(() => resolve({ data: null, error: { message: 'Timeout' } }), timeout)
      )
    ])

    if (error) {
      if (error.message === 'Timeout') {
        console.warn('⚠️ [getAllCategories] Timeout após 5s')
        // Retornar cache antigo se disponível
        return categoriesCache?.data || []
      }
      console.error('❌ [getAllCategories] Erro:', error)
      console.error('   Código:', error.code)
      console.error('   Mensagem:', error.message)
      console.error('   Detalhes:', error.details)
      return categoriesCache?.data || []
    }

    // Atualizar cache
    categoriesCache = {
      data: data || [],
      timestamp: Date.now()
    }

    const totalTime = Date.now() - startTime
    console.log(`✅ [getAllCategories] ${data?.length || 0} categorias encontradas em ${totalTime}ms`)
    if (data && data.length > 0) {
      console.log(`   Primeiras categorias: ${data.slice(0, 3).map(c => c.name).join(', ')}`)
    }
    return data || []
  } catch (error: any) {
    console.error('❌ [getAllCategories] Erro geral:', error)
    console.error('   Stack:', error.stack)
    return categoriesCache?.data || []
  }
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('slug', slug)
      .single()

    if (error) throw error

    return data
  } catch (error) {
    console.error('Error fetching category:', error)
    return null
  }
}

export async function getCategoryStats(categoryId: string) {
  try {
    const { count, error } = await supabase
      .from('offers')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', categoryId)
      .eq('is_active', true)

    if (error) throw error

    return { offerCount: count || 0 }
  } catch (error) {
    console.error('Error fetching category stats:', error)
    return { offerCount: 0 }
  }
}


