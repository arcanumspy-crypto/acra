import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getAuthenticatedUser } from "@/lib/auth/isAuthenticated"

export async function GET(request: Request) {
  try {
    const { user, error: authError } = await getAuthenticatedUser(request)

    if (authError || !user) {
      console.error('[GET /api/produtividade/financeiro] Erro de autenticação:', authError)
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      )
    }

    // Criar cliente Supabase - tentar com cookies primeiro
    let supabase = await createClient()
    
    // Verificar autenticação do cliente
    const { data: { user: supabaseUser }, error: supabaseAuthError } = await supabase.auth.getUser()
    
    // Se não estiver autenticado via cookies, tentar via header Authorization
    if (supabaseAuthError || !supabaseUser) {
      const authHeader = request.headers.get('authorization') || request.headers.get('Authorization')
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7)
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
        supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
          global: {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        })
      }
    }

    // Buscar transações
    const { data: transacoes, error: transacoesError } = await supabase
      .from('transacoes_financeiras')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (transacoesError) {
      console.error('Erro ao buscar transações:', transacoesError)
    }

    // Calcular totais
    const receitas = (transacoes as any[])?.filter((t: any) => t.tipo === 'receita').reduce((sum: number, t: any) => sum + (t.valor || 0), 0) || 0
    const despesas = (transacoes as any[])?.filter((t: any) => t.tipo === 'despesa').reduce((sum: number, t: any) => sum + (t.valor || 0), 0) || 0
    const saldo = receitas - despesas

    return NextResponse.json({
      success: true,
      receitas,
      despesas,
      saldo,
      transacoes: transacoes || []
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao processar requisição" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const { user, error: authError } = await getAuthenticatedUser(request)

    if (authError || !user) {
      console.error('[POST /api/produtividade/financeiro] Erro de autenticação:', authError)
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      )
    }

    // Criar cliente Supabase - tentar com cookies primeiro
    let supabase = await createClient()
    
    // Verificar autenticação do cliente
    const { data: { user: supabaseUser }, error: supabaseAuthError } = await supabase.auth.getUser()
    
    // Se não estiver autenticado via cookies, tentar via header Authorization
    if (supabaseAuthError || !supabaseUser) {
      const authHeader = request.headers.get('authorization') || request.headers.get('Authorization')
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7)
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
        supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
          global: {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        })
      }
    }

    let body
    try {
      body = await request.json()
    } catch (parseError) {
      console.error('[POST /api/produtividade/financeiro] Erro ao parsear JSON:', parseError)
      return NextResponse.json(
        { error: "Erro ao processar dados da requisição" },
        { status: 400 }
      )
    }
    const { tipo, descricao, valor, categoria, data } = body

    // Validações
    if (!tipo || (tipo !== 'receita' && tipo !== 'despesa')) {
      return NextResponse.json(
        { error: "Tipo deve ser 'receita' ou 'despesa'" },
        { status: 400 }
      )
    }

    if (!descricao || !descricao.trim()) {
      return NextResponse.json(
        { error: "Descrição é obrigatória" },
        { status: 400 }
      )
    }

    if (valor === undefined || valor === null) {
      return NextResponse.json(
        { error: "Valor é obrigatório" },
        { status: 400 }
      )
    }

    const valorNumerico = typeof valor === 'string' 
      ? parseFloat(valor.replace(',', '.')) 
      : Number(valor)

    if (isNaN(valorNumerico) || valorNumerico <= 0) {
      return NextResponse.json(
        { error: "Valor deve ser um número maior que zero" },
        { status: 400 }
      )
    }

    const { data: transacao, error } = await (supabase
      .from('transacoes_financeiras') as any)
      .insert({
        user_id: user.id,
        tipo,
        descricao: descricao.trim(),
        valor: valorNumerico,
        categoria: categoria || 'outros',
        data: data || new Date().toISOString().split('T')[0]
      })
      .select()
      .single()

    if (error) {
      console.error('[POST /api/produtividade/financeiro] Erro ao criar transação:', error)
      return NextResponse.json(
        { error: "Erro ao criar transação", details: error.message, code: error.code },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      transacao
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao processar requisição" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const { user, error: authError } = await getAuthenticatedUser(request)

    if (authError || !user) {
      console.error('[DELETE /api/produtividade/financeiro] Erro de autenticação:', authError)
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      )
    }

    // Criar cliente Supabase - tentar com cookies primeiro
    let supabase = await createClient()
    
    // Verificar autenticação do cliente
    const { data: { user: supabaseUser }, error: supabaseAuthError } = await supabase.auth.getUser()
    
    // Se não estiver autenticado via cookies, tentar via header Authorization
    if (supabaseAuthError || !supabaseUser) {
      const authHeader = request.headers.get('authorization') || request.headers.get('Authorization')
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7)
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
        supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
          global: {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        })
      }
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: "ID é obrigatório" },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('transacoes_financeiras')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      return NextResponse.json(
        { error: "Erro ao deletar transação", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao processar requisição" },
      { status: 500 }
    )
  }
}

