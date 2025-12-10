import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    let { data: { user }, error: authError } = await supabase.auth.getUser()

    // Se não conseguir via cookies, tentar via header
    if (!user && authError) {
      const authHeader = request.headers.get('authorization') || request.headers.get('Authorization')
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7)
        const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
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

    if (!user) {
      return NextResponse.json(
        { hasActivePayment: false },
        { status: 401 }
      )
    }

    // Verificar se tem pagamento confirmado
    const adminClient = createAdminClient()
    const { data: payment } = await (adminClient
      .from('payments') as any)
      .select('id, status')
      .eq('user_id', user.id)
      .eq('status', 'confirmed')
      .order('payment_date', { ascending: false })
      .limit(1)
      .maybeSingle()

    // Verificar se tem subscription ativa
    const { data: subscription } = await (adminClient
      .from('subscriptions') as any)
      .select('id, status, trial_ends_at')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    // Verificar se subscription não expirou
    const hasActiveSubscription = subscription && (
      !subscription.trial_ends_at || 
      new Date(subscription.trial_ends_at) > new Date()
    )

    const hasActivePayment = !!(payment || hasActiveSubscription)

    return NextResponse.json({
      hasActivePayment,
      hasPayment: !!payment,
      hasSubscription: hasActiveSubscription
    })
  } catch (error: any) {
    console.error('Erro ao verificar pagamento:', error)
    return NextResponse.json(
      { hasActivePayment: false },
      { status: 500 }
    )
  }
}

