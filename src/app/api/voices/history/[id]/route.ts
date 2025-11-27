import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    
    // Tentar obter usuário
    let user = null
    let authError = null
    
    const getUserResult = await supabase.auth.getUser()
    user = getUserResult.data?.user || null
    authError = getUserResult.error
    
    // Se não funcionou, tenta ler do header Authorization
    if (!user) {
      const authHeader = request.headers.get('authorization')
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.replace('Bearer ', '')
        const tokenResult = await supabase.auth.getUser(token)
        user = tokenResult.data?.user || null
        authError = tokenResult.error
      }
    }
    
    if (!user) {
      return NextResponse.json(
        { 
          error: "Não autenticado", 
          details: authError?.message || "Sessão não encontrada",
        },
        { status: 401 }
      )
    }

    const narrationId = params.id

    // Deletar narração (apenas se pertencer ao usuário)
    try {
      const adminClient = createAdminClient()
      
      const { error: deleteError } = await adminClient
        .from('voice_audio_generations')
        .delete()
        .eq('id', narrationId)
        .eq('user_id', user.id)

      if (deleteError) {
        console.error('Erro ao deletar narração:', deleteError)
        return NextResponse.json(
          { error: "Erro ao deletar narração", details: deleteError.message },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: "Narração deletada com sucesso",
      })
    } catch (adminError: any) {
      console.error('❌ Erro ao criar admin client:', adminError.message)
      
      if (adminError.message?.includes('SUPABASE_SERVICE_ROLE_KEY')) {
        return NextResponse.json(
          { 
            error: "Configuração incompleta",
            details: adminError.message,
            hint: "Configure SUPABASE_SERVICE_ROLE_KEY no .env.local e reinicie o servidor"
          },
          { status: 500 }
        )
      }
      
      throw adminError
    }

  } catch (error: any) {
    console.error('❌ Erro ao deletar narração:', error)
    
    return NextResponse.json(
      { error: error.message || "Erro ao processar requisição" },
      { status: 500 }
    )
  }
}

