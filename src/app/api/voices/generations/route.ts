import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * GET /api/voices/generations
 * Lista todas as gerações de voz do usuário autenticado
 * 
 * Query params:
 * - voiceCloneId: (opcional) Filtrar por voz específica
 * - limit: (opcional) Limite de resultados (padrão: 50)
 * - offset: (opcional) Offset para paginação (padrão: 0)
 */
export async function GET(request: NextRequest) {
  try {
    // Autenticação
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      )
    }

    // Parâmetros de query
    const searchParams = request.nextUrl.searchParams
    const voiceCloneId = searchParams.get('voiceCloneId')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Usar admin client para bypass RLS (mas filtrar por user_id manualmente)
    const adminClient = createAdminClient()

    // Construir query
    let query = adminClient
      .from('voice_audio_generations')
      .select(`
        *,
        voice_clones (
          id,
          name,
          voice_id,
          description
        )
      `)
      .eq('user_id', user.id) // Filtrar apenas gerações do usuário
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Filtrar por voz específica se fornecido
    if (voiceCloneId) {
      query = query.eq('voice_clone_id', voiceCloneId)
    }

    const { data: generations, error } = await query

    if (error) {
      console.error('Erro ao buscar gerações:', error)
      return NextResponse.json(
        { error: "Erro ao buscar histórico de gerações" },
        { status: 500 }
      )
    }

    // Contar total de gerações (para paginação)
    let countQuery = adminClient
      .from('voice_audio_generations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if (voiceCloneId) {
      countQuery = countQuery.eq('voice_clone_id', voiceCloneId)
    }

    const { count } = await countQuery

    return NextResponse.json({
      success: true,
      generations: generations || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit
      }
    })

  } catch (error: any) {
    console.error('Erro ao listar gerações:', error)
    return NextResponse.json(
      { error: error.message || "Erro ao processar requisição" },
      { status: 500 }
    )
  }
}

