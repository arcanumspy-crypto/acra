import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(request: Request) {
  try {
    const adminClient = createAdminClient()
    
    const { data: plans, error } = await adminClient
      .from('plans')
      .select('*')
      .order('price_monthly_cents', { ascending: true })

    if (error) {
      return NextResponse.json(
        { error: "Erro ao buscar planos", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ plans: plans || [] })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao processar requisição" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const adminClient = createAdminClient()
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json(
        { error: "ID do plano é obrigatório" },
        { status: 400 }
      )
    }

    const { data, error } = await adminClient
      .from('plans')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: "Erro ao atualizar plano", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ plan: data })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao processar requisição" },
      { status: 500 }
    )
  }
}

