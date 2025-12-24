import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { CATEGORIES } from "@/lib/constants"
import { withLongCache } from "@/lib/api-cache"

export async function GET() {
  try {
    // Try to get categories from Supabase
    // Use admin client as fallback to bypass RLS (categories are public data)
    let supabase = await createClient()
    
    // First try with regular client (will work if user is authenticated)
    let categoriesQuery = supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true })

    const timeoutPromise = new Promise<{ data: null; error: { message: string } }>((_, reject) => 
      setTimeout(() => reject(new Error('Timeout ao buscar categorias')), 5000)
    )

    let queryResult
    try {
      queryResult = await Promise.race([
        categoriesQuery,
        timeoutPromise
      ])
    } catch (timeoutError) {
      // Timeout occurred, try with admin client
      console.warn('⚠️ [Categories] Timeout com client regular, tentando com admin client')
      try {
        const adminClient = createAdminClient()
        const { data: adminData, error: adminError } = await adminClient
          .from('categories')
          .select('*')
          .order('name', { ascending: true })
        
        if (!adminError && adminData && adminData.length > 0) {
          const response = NextResponse.json({ categories: adminData })
          return withLongCache(response)
        }
      } catch (adminError) {
        // Continue to fallback
      }
      
      // Use static categories as fallback
      console.warn('⚠️ [Categories] Timeout ao buscar categorias, usando categorias estáticas')
      const response = NextResponse.json({ categories: CATEGORIES.map(cat => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        emoji: cat.icon || null,
        description: cat.description || null,
        is_premium: false,
        created_at: new Date().toISOString(),
      })) })
      return withLongCache(response)
    }

    const { data, error } = queryResult as { data: any[] | null; error: any }

    // If error (likely RLS issue), try with admin client
    if (error) {
      // Check if it's an RLS/permission error
      if (error.code === 'PGRST301' || error.message?.includes('permission') || error.message?.includes('policy')) {
        console.warn('⚠️ [Categories] Erro de permissão, tentando com admin client:', error.message || error.code)
        try {
          const adminClient = createAdminClient()
          const { data: adminData, error: adminError } = await adminClient
            .from('categories')
            .select('*')
            .order('name', { ascending: true })
          
          if (!adminError && adminData && adminData.length > 0) {
            const response = NextResponse.json({ categories: adminData })
            return withLongCache(response)
          }
        } catch (adminError) {
          // Continue to fallback
        }
      }
      
      console.warn('⚠️ [Categories] Erro ao buscar do Supabase:', error.message || error.code || 'Erro desconhecido')
      const response = NextResponse.json({ categories: CATEGORIES.map(cat => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        emoji: cat.icon || null,
        description: cat.description || null,
        is_premium: false,
        created_at: new Date().toISOString(),
      })) })
      return withLongCache(response)
    }

    if (!data || data.length === 0) {
      console.warn('⚠️ [Categories] Tabela categories vazia no Supabase, usando categorias estáticas')
      const response = NextResponse.json({ categories: CATEGORIES.map(cat => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        emoji: cat.icon || null,
        description: cat.description || null,
        is_premium: false,
        created_at: new Date().toISOString(),
      })) })
      return withLongCache(response)
    }

    // Success: return data from Supabase
    const response = NextResponse.json({ categories: data })
    return withLongCache(response)
  } catch (error: any) {
    // Fallback to static categories if there's any unexpected error
    console.warn('⚠️ [Categories] Erro inesperado, usando categorias estáticas:', error?.message || error)
    const response = NextResponse.json({ categories: CATEGORIES.map(cat => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      emoji: cat.icon || null,
      description: cat.description || null,
      is_premium: false,
      created_at: new Date().toISOString(),
    })) })
    return withLongCache(response)
  }
}

