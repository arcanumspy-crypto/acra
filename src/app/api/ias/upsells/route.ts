import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

// GET - Buscar histórico de upsells do usuário
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      )
    }

    const adminClient = createAdminClient()

    // Buscar upsells do usuário
    const { data, error } = await adminClient
      .from('upsells_gerados')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar upsells:', error)
      return NextResponse.json(
        { error: "Erro ao buscar upsells", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      upsells: data || []
    })
  } catch (error: any) {
    console.error('Erro em GET /api/ias/upsells:', error)
    return NextResponse.json(
      { error: error.message || "Erro ao buscar upsells" },
      { status: 500 }
    )
  }
}

// DELETE - Deletar upsell
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: "ID do upsell é obrigatório" },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()

    // Verificar se o upsell pertence ao usuário
    const { data: upsell, error: fetchError } = await adminClient
      .from('upsells_gerados')
      .select('user_id')
      .eq('id', id)
      .single()

    if (fetchError || !upsell) {
      return NextResponse.json(
        { error: "Upsell não encontrado" },
        { status: 404 }
      )
    }

    const upsellUserId = upsell ? (upsell as unknown as { user_id?: string }).user_id : null

    if (upsellUserId !== user.id) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 403 }
      )
    }

    // Deletar upsell
    const { error: deleteError } = await adminClient
      .from('upsells_gerados')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Erro ao deletar upsell:', deleteError)
      return NextResponse.json(
        { error: "Erro ao deletar upsell", details: deleteError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Upsell deletado com sucesso"
    })
  } catch (error: any) {
    console.error('Erro em DELETE /api/ias/upsells:', error)
    return NextResponse.json(
      { error: error.message || "Erro ao deletar upsell" },
      { status: 500 }
    )
  }
}

