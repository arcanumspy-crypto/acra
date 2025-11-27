import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      )
    }

    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select(`
        *,
        plan:plans(*)
      `)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle()

    if (error) throw error

    return NextResponse.json({ subscription })
  } catch (error: any) {
    console.error('Error fetching subscription:', error)
    return NextResponse.json(
      { error: error.message || "Erro ao buscar assinatura" },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      )
    }

    const { plan_id } = await request.json()

    if (!plan_id) {
      return NextResponse.json(
        { error: "plan_id é obrigatório" },
        { status: 400 }
      )
    }

    // Get current subscription
    const { data: currentSubscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle()

    // Calculate period end (30 days from now)
    const currentPeriodEnd = new Date()
    currentPeriodEnd.setDate(currentPeriodEnd.getDate() + 30)

    let subscription
    
    if (currentSubscription) {
      // Update existing subscription
      const { data, error } = await supabase
        .from('subscriptions')
        .update({
          plan_id,
          current_period_end: currentPeriodEnd.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentSubscription.id)
        .select(`
          *,
          plan:plans(*)
        `)
        .single()

      if (error) throw error
      subscription = data
    } else {
      // Create new subscription
      const { data, error } = await supabase
        .from('subscriptions')
        .insert({
          user_id: user.id,
          plan_id,
          status: 'active',
          current_period_end: currentPeriodEnd.toISOString(),
        })
        .select(`
          *,
          plan:plans(*)
        `)
        .single()

      if (error) throw error
      subscription = data
    }

    return NextResponse.json({ subscription })
  } catch (error: any) {
    console.error('Error updating subscription:', error)
    return NextResponse.json(
      { error: error.message || "Erro ao atualizar plano" },
      { status: 500 }
    )
  }
}
