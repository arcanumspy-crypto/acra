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
      // Retornar false em vez de 401 para não quebrar o layout
      return NextResponse.json({
        hasActivePayment: false,
        hasPayment: false,
        hasSubscription: false
      })
    }

    // Verificar se tem pagamento confirmado
    const adminClient = createAdminClient()
    let payment = null
    let subscription = null
    
    try {
      // Tentar buscar pagamento (pode não existir tabela)
      const { data: paymentData } = await (adminClient
        .from('payments') as any)
        .select('id, status, paid_at, period_end')
        .eq('user_id', user.id)
        .in('status', ['confirmed', 'completed', 'paid'])
        .order('paid_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      
      payment = paymentData
    } catch (e) {
      // Tabela pode não existir
    }

    try {
      // Verificar subscription ativa
      const { data: subData } = await (adminClient
        .from('subscriptions') as any)
        .select('id, status, current_period_end, trial_ends_at')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      
      subscription = subData
    } catch (e) {
      // Tabela pode não existir
    }

    // Verificar se subscription não expirou (usar current_period_end ou trial_ends_at)
    const subscriptionEndDate = subscription?.current_period_end || subscription?.trial_ends_at
    const hasActiveSubscription = subscription && subscriptionEndDate && (
      new Date(subscriptionEndDate) > new Date()
    )

    // Verificar perfil para has_active_subscription e role (PRIORIDADE MÁXIMA)
    let profileHasActiveSubscription = false
    let profileSubscriptionEnd = false
    let isAdmin = false
    try {
      const { data: profile } = await (adminClient
        .from('profiles') as any)
        .select('has_active_subscription, subscription_ends_at, role')
        .eq('id', user.id)
        .single()
      
      console.log('🔍 [Payment Check] Perfil do usuário:', {
        userId: user.id,
        role: profile?.role,
        has_active_subscription: profile?.has_active_subscription,
        subscription_ends_at: profile?.subscription_ends_at
      })
      
      // ADMINS TÊM ACESSO VITALÍCIO - NÃO PRECISAM DE PAGAMENTO
      if (profile?.role === 'admin') {
        isAdmin = true
        console.log('✅ [Payment Check] Usuário é ADMIN - acesso vitalício concedido')
      }
      
      // Se has_active_subscription é true, considerar ativo
      if (profile?.has_active_subscription === true) {
        profileHasActiveSubscription = true
        
        // Se tem data de término, verificar se não expirou
        if (profile?.subscription_ends_at) {
          profileSubscriptionEnd = new Date(profile.subscription_ends_at) > new Date()
        } else {
          // Se não tem data mas tem has_active_subscription = true, considerar ativo
          profileSubscriptionEnd = true
        }
      }
    } catch (e) {
      console.error('❌ [Payment Check] Erro ao verificar perfil:', e)
    }

    // Se o perfil indica que tem assinatura ativa OU é admin, usar isso (prioridade máxima)
    // ADMINS SEMPRE TÊM ACESSO VITALÍCIO
    const hasActivePayment = !!(isAdmin || profileHasActiveSubscription || payment || hasActiveSubscription || profileSubscriptionEnd)
    
    console.log('✅ [Payment Check] Resultado:', {
      hasActivePayment,
      profileHasActiveSubscription,
      hasPayment: !!payment,
      hasSubscription: hasActiveSubscription,
      profileSubscriptionEnd
    })

    return NextResponse.json({
      hasActivePayment,
      hasPayment: !!payment,
      hasSubscription: hasActiveSubscription
    })
  } catch (error: any) {
    return NextResponse.json({
      hasActivePayment: false,
      hasPayment: false,
      hasSubscription: false
    })
  }
}

