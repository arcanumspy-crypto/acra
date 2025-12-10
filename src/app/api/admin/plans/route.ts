import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireAdmin } from "@/lib/api-helpers/auth"
import { ensureArray, ensureSingle } from "@/lib/supabase-utils"
import type { PlanRow, PlanUpdate } from "@/types/api"

export async function GET(request: Request) {
  try {
    // Verificar autenticação e admin
    const authResult = await requireAdmin(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const adminClient = createAdminClient()
    
    const { data: plansRaw, error } = await adminClient
      .from('plans')
      .select('*')
      .order('price_monthly_cents', { ascending: true })

    if (error) {
      return NextResponse.json(
        { error: "Erro ao buscar planos", details: error.message },
        { status: 500 }
      )
    }

    // Garantir array tipado
    const plans = ensureArray<PlanRow>(plansRaw)

    return NextResponse.json({ plans })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Erro ao processar requisição"
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    // Verificar autenticação e admin
    const authResult = await requireAdmin(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const adminClient = createAdminClient()
    const body = await request.json()
    const { id, ...updates } = body

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: "ID do plano é obrigatório" },
        { status: 400 }
      )
    }

    // Tipar updates corretamente e usar type assertion para Supabase
    const typedUpdates: Partial<PlanUpdate> = updates

    const { data: planRaw, error } = await (adminClient as any)
      .from('plans')
      .update(typedUpdates as any)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: "Erro ao atualizar plano", details: error.message },
        { status: 500 }
      )
    }

    // Garantir tipo e verificar se existe
    const plan = ensureSingle<PlanRow>(planRaw)
    if (!plan) {
      return NextResponse.json(
        { error: "Plano não encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json({ plan })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Erro ao processar requisição"
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

