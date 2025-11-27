import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { 
  getCreditStats,
  getAllUsersWithCredits,
  getUsersWithNegativeBalance 
} from "@/lib/db/credits"

/**
 * GET /api/admin/credits
 * Obter estatísticas e visão geral de créditos (apenas admin)
 */
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

    // Verificar se é admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const view = searchParams.get('view') || 'stats' // stats, users, debts

    if (view === 'stats') {
      const stats = await getCreditStats()
      return NextResponse.json({
        success: true,
        stats
      })
    }

    if (view === 'users') {
      const users = await getAllUsersWithCredits()
      return NextResponse.json({
        success: true,
        users
      })
    }

    if (view === 'debts') {
      const debts = await getUsersWithNegativeBalance()
      return NextResponse.json({
        success: true,
        debts
      })
    }

    return NextResponse.json(
      { error: "View inválido. Use: stats, users ou debts" },
      { status: 400 }
    )
  } catch (error: any) {
    console.error('Error in GET /api/admin/credits:', error)
    return NextResponse.json(
      { error: error.message || "Erro ao obter dados de créditos" },
      { status: 500 }
    )
  }
}









