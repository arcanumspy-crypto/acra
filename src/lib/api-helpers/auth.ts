/**
 * Helpers centralizados para autenticação em rotas API
 * 
 * Elimina duplicação de código de autenticação entre rotas
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { User } from '@/types/api'

/**
 * Obtém o usuário autenticado de cookies ou Authorization header
 * 
 * @param request - Request object do Next.js
 * @returns Usuário autenticado ou null
 */
export async function getAuthenticatedUser(request: Request): Promise<User | null> {
  try {
    // Tentar obter de cookies primeiro
    const supabase = await createClient()
    let { data: { user }, error: authError } = await supabase.auth.getUser()
    
    // Se falhar, tentar do Authorization header
    if (authError || !user) {
      const authHeader = request.headers.get('Authorization')
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7)
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        
        const tempClient = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
          global: {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        })
        
        const { data: { user: userFromToken } } = await tempClient.auth.getUser(token)
        if (userFromToken) {
          user = userFromToken
        }
      }
    }
    
    return user
  } catch (error) {
    console.error('Erro ao obter usuário autenticado:', error)
    return null
  }
}

/**
 * Verifica se o usuário é admin
 * 
 * @param userId - ID do usuário
 * @returns true se for admin, false caso contrário
 */
export async function verifyAdmin(userId: string): Promise<boolean> {
  try {
    const adminClient = createAdminClient()
    const { data: profileRaw, error } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()
    
    if (error || !profileRaw) {
      return false
    }
    
    // Garantir tipo correto
    const profile = profileRaw as { role?: string } | null
    if (!profile || !profile.role) {
      return false
    }
    
    return profile.role === 'admin'
  } catch (error) {
    console.error('Erro ao verificar admin:', error)
    return false
  }
}

/**
 * Middleware helper que verifica autenticação e retorna erro se não autenticado
 * 
 * @param request - Request object
 * @returns Usuário autenticado ou NextResponse com erro
 */
export async function requireAuth(
  request: Request
): Promise<{ user: User } | NextResponse> {
  const user = await getAuthenticatedUser(request)
  
  if (!user) {
    return NextResponse.json(
      { error: 'Não autenticado' },
      { status: 401 }
    )
  }
  
  return { user }
}

/**
 * Middleware helper que verifica se o usuário é admin
 * 
 * @param request - Request object
 * @returns Usuário admin ou NextResponse com erro
 */
export async function requireAdmin(
  request: Request
): Promise<{ user: User } | NextResponse> {
  // Primeiro verificar autenticação
  const authResult = await requireAuth(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }
  
  const { user } = authResult
  
  // Depois verificar se é admin
  const isAdmin = await verifyAdmin(user.id)
  if (!isAdmin) {
    return NextResponse.json(
      { error: 'Não autorizado. Apenas administradores podem acessar este recurso.' },
      { status: 403 }
    )
  }
  
  return { user }
}

