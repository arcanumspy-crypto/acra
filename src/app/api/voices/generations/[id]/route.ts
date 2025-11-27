import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * DELETE /api/voices/generations/[id]
 * Exclui uma geração específica do usuário autenticado
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const generationId = params.id

    if (!generationId) {
      return NextResponse.json(
        { error: "ID da geração é obrigatório" },
        { status: 400 }
      )
    }

    // Verificar se a geração pertence ao usuário
    const adminClient = createAdminClient()
    const { data: generation, error: fetchError } = await adminClient
      .from('voice_audio_generations')
      .select('*')
      .eq('id', generationId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !generation) {
      return NextResponse.json(
        { error: "Geração não encontrada ou você não tem permissão para excluí-la" },
        { status: 404 }
      )
    }

    // Excluir geração
    const { error: deleteError } = await adminClient
      .from('voice_audio_generations')
      .delete()
      .eq('id', generationId)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Erro ao excluir geração:', deleteError)
      return NextResponse.json(
        { error: "Erro ao excluir geração" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Geração excluída com sucesso"
    })

  } catch (error: any) {
    console.error('Erro ao excluir geração:', error)
    return NextResponse.json(
      { error: error.message || "Erro ao processar requisição" },
      { status: 500 }
    )
  }
}

