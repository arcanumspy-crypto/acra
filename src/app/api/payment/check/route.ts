import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(request: NextRequest) {
  console.log('🚀 [Payment Check] ROTA CHAMADA - Iniciando verificação...')
  try {
    let user: any = null
    let authError: any = null
    
    // ESTRATÉGIA 1: Tentar via cookies usando createClient
    try {
      const supabase = await createClient()
      const { data: { user: userFromCookies }, error: cookieError } = await supabase.auth.getUser()
      
      if (userFromCookies && !cookieError) {
        user = userFromCookies
        console.log('✅ [Payment Check] Usuário autenticado via cookies:', user.id)
      } else {
        authError = cookieError
        console.log('⚠️ [Payment Check] Erro ao autenticar via cookies:', cookieError?.message)
      }
    } catch (cookieErr) {
      console.log('⚠️ [Payment Check] Erro ao criar client de cookies:', cookieErr)
    }

    // ESTRATÉGIA 2: Se não conseguiu via cookies, tentar via header Authorization
    if (!user && authError) {
      const authHeader = request.headers.get('authorization') || request.headers.get('Authorization')
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7)
        try {
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
          const { data: { user: userFromToken }, error: tokenError } = await tempClient.auth.getUser(token)
          if (userFromToken && !tokenError) {
            user = userFromToken
            console.log('✅ [Payment Check] Usuário autenticado via token:', user.id)
          } else {
            console.log('⚠️ [Payment Check] Erro ao autenticar via token:', tokenError?.message)
          }
        } catch (tokenErr) {
          console.log('⚠️ [Payment Check] Erro ao processar token:', tokenErr)
        }
      }
    }

    // ESTRATÉGIA 3: Se ainda não tem usuário, tentar buscar via cookies da requisição diretamente
    if (!user) {
      try {
        const cookieHeader = request.headers.get('cookie')
        if (cookieHeader) {
          // Tentar extrair o access_token dos cookies
          const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
            const [key, value] = cookie.trim().split('=')
            acc[key] = value
            return acc
          }, {} as Record<string, string>)

          // Procurar por tokens do Supabase nos cookies
          const sbAccessToken = cookies['sb-access-token'] || cookies[`sb-${process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0]}-auth-token`]
          
          if (sbAccessToken) {
            console.log('🔍 [Payment Check] Tentando usar token dos cookies...')
            // Tentar usar o token encontrado
            const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
            const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            const tempClient = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
              global: {
                headers: {
                  Authorization: `Bearer ${sbAccessToken}`,
                },
              },
            })
            const { data: { user: userFromCookieToken } } = await tempClient.auth.getUser(sbAccessToken)
            if (userFromCookieToken) {
              user = userFromCookieToken
              console.log('✅ [Payment Check] Usuário autenticado via cookie token:', user.id)
            }
          }
        }
      } catch (cookieTokenErr) {
        console.log('⚠️ [Payment Check] Erro ao processar cookie token:', cookieTokenErr)
      }
    }

    if (!user) {
      console.log('❌ [Payment Check] Usuário não autenticado após todas as tentativas')
      // Retornar false em vez de 401 para não quebrar o layout
      return NextResponse.json({
        hasActivePayment: false,
        hasPayment: false,
        hasSubscription: false
      })
    }

    // Verificar se tem pagamento confirmado
    const adminClient = createAdminClient()
    
    // Log inicial
    console.log('🔍 [Payment Check] ========== INICIANDO VERIFICAÇÃO ==========')
    console.log('🔍 [Payment Check] User ID:', user.id)
    console.log('🔍 [Payment Check] User Email:', user.email)
    
    let payment = null
    let subscription = null
    
    try {
      // Buscar pagamento - buscar por status completed OU por transaction_id
      const { data: paymentData, error: paymentError } = await (adminClient
        .from('payments') as any)
        .select('id, status, paid_at, period_end, transaction_id')
        .eq('user_id', user.id)
        .in('status', ['confirmed', 'completed', 'paid'])
        .order('paid_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      
      if (paymentError) {
        console.error('❌ [Payment Check] ERRO ao buscar payment:', {
          error: paymentError,
          code: paymentError?.code,
          message: paymentError?.message,
          details: paymentError?.details
        })
      } else {
        payment = paymentData
        console.log('🔍 [Payment Check] Resultado da busca payment:', {
          paymentData: paymentData,
          exists: !!payment,
          isNull: payment === null,
          status: payment?.status,
          id: payment?.id,
          user_id: payment?.user_id
        })
      }
    } catch (e) {
      console.error('❌ [Payment Check] Erro ao buscar payment:', e)
    }

    try {
      // Verificar subscription ativa
      const { data: subData, error: subError } = await (adminClient
        .from('subscriptions') as any)
        .select('id, status, current_period_end, trial_ends_at')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      
      if (subError) {
        console.error('❌ [Payment Check] ERRO ao buscar subscription:', {
          error: subError,
          code: subError?.code,
          message: subError?.message,
          details: subError?.details
        })
      } else {
        subscription = subData
        console.log('🔍 [Payment Check] Resultado da busca subscription:', {
          subData: subData,
          exists: !!subscription,
          isNull: subscription === null,
          status: subscription?.status,
          id: subscription?.id,
          user_id: subscription?.user_id
        })
      }
    } catch (e) {
      console.error('❌ [Payment Check] Erro ao buscar subscription:', e)
    }

    // Verificar se subscription não expirou (usar current_period_end ou trial_ends_at)
    const subscriptionEndDate = subscription?.current_period_end || subscription?.trial_ends_at
    const hasActiveSubscription = subscription && subscriptionEndDate && (
      new Date(subscriptionEndDate) > new Date()
    )

    // Verificar perfil para has_active_subscription e role (PRIORIDADE MÁXIMA)
    // IMPORTANTE: Esta é a verificação principal - o perfil é a fonte da verdade
    let profileHasActiveSubscription = false
    let profileSubscriptionEnd = false
    let isAdmin = false
    try {
      // FORÇAR BUSCA SEM CACHE - garantir dados atualizados
      // Usar select explícito para evitar problemas de cache
      const { data: profile, error: profileError } = await (adminClient
        .from('profiles') as any)
        .select('id, has_active_subscription, subscription_ends_at, role, updated_at')
        .eq('id', user.id)
        .single()
      
      if (profileError) {
        console.error('❌ [Payment Check] Erro ao buscar perfil:', {
          error: profileError,
          code: profileError?.code,
          message: profileError?.message,
          details: profileError?.details,
          hint: profileError?.hint,
          userId: user.id
        })
      }
      
      console.log('🔍 [Payment Check] ========== RESULTADO PERFIL ==========')
      console.log('🔍 [Payment Check] Profile Error:', profileError)
      console.log('🔍 [Payment Check] Profile Data:', profile)
      console.log('🔍 [Payment Check] has_active_subscription:', profile?.has_active_subscription)
      console.log('🔍 [Payment Check] has_active_subscription === true?', profile?.has_active_subscription === true)
      console.log('🔍 [Payment Check] subscription_ends_at:', profile?.subscription_ends_at)
      
      // Se não encontrou perfil, isso é um problema crítico
      if (!profile && !profileError) {
        console.error('❌ [Payment Check] PERFIL NÃO ENCONTRADO! userId:', user.id)
      }
      
      // ADMINS TÊM ACESSO VITALÍCIO - NÃO PRECISAM DE PAGAMENTO
      if (profile?.role === 'admin') {
        isAdmin = true
        console.log('✅ [Payment Check] Usuário é ADMIN - acesso vitalício concedido')
      }
      
      // PRIORIDADE 1: Se has_active_subscription é true, considerar ativo IMEDIATAMENTE
      // Verificar de múltiplas formas para garantir
      const hasActiveSubValue = profile?.has_active_subscription
      const isTrue = hasActiveSubValue === true || hasActiveSubValue === 'true' || hasActiveSubValue === 1
      
      if (isTrue) {
        profileHasActiveSubscription = true
        console.log('✅ [Payment Check] has_active_subscription = TRUE no perfil (confirmado)')
        
        // Se tem data de término, verificar se não expirou
        if (profile?.subscription_ends_at) {
          const endDate = new Date(profile.subscription_ends_at)
          const now = new Date()
          profileSubscriptionEnd = endDate > now
          
          if (profileSubscriptionEnd) {
            console.log('✅ [Payment Check] Assinatura válida até:', endDate.toISOString())
          } else {
            console.log('⚠️ [Payment Check] Assinatura expirada em:', endDate.toISOString())
            // Mesmo expirada, se has_active_subscription = true, considerar ativo
            profileSubscriptionEnd = true
          }
        } else {
          // Se não tem data mas tem has_active_subscription = true, considerar ativo
          profileSubscriptionEnd = true
          console.log('✅ [Payment Check] has_active_subscription = true sem data de término (vitalício ou ativo)')
        }
      } else {
        console.log('⚠️ [Payment Check] has_active_subscription NÃO é true:', {
          value: hasActiveSubValue,
          type: typeof hasActiveSubValue,
          isTrue: isTrue
        })
      }
    } catch (e) {
      console.error('❌ [Payment Check] Erro ao verificar perfil:', e)
    }

    // LÓGICA DE VERIFICAÇÃO: PRIORIDADE MÁXIMA PARA PERFIL
    // Se has_active_subscription = true no perfil, retornar true IMEDIATAMENTE
    // Não precisa verificar payment ou subscription se o perfil já está ativo
    let hasActivePayment = false
    
    if (isAdmin) {
      hasActivePayment = true
      console.log('✅ [Payment Check] ADMIN - acesso vitalício')
    } else if (profileHasActiveSubscription === true) {
      // Se o perfil tem has_active_subscription = true, considerar ativo
      hasActivePayment = true
      console.log('✅ [Payment Check] PERFIL ATIVO - has_active_subscription = true')
    } else if (profileSubscriptionEnd === true) {
      hasActivePayment = true
      console.log('✅ [Payment Check] PERFIL ATIVO - subscription válida')
    } else if (payment && ['completed', 'confirmed', 'paid'].includes(payment.status)) {
      hasActivePayment = true
      console.log('✅ [Payment Check] PAYMENT ATIVO')
    } else if (hasActiveSubscription) {
      hasActivePayment = true
      console.log('✅ [Payment Check] SUBSCRIPTION ATIVA')
    } else {
      hasActivePayment = false
      console.log('❌ [Payment Check] NENHUM MÉTODO DE VERIFICAÇÃO RETORNOU TRUE')
    }
    
    console.log('✅ [Payment Check] ========== RESULTADO FINAL ==========')
    console.log('✅ [Payment Check] hasActivePayment (FINAL):', hasActivePayment)
    console.log('✅ [Payment Check] isAdmin:', isAdmin)
    console.log('✅ [Payment Check] profileHasActiveSubscription:', profileHasActiveSubscription)
    console.log('✅ [Payment Check] profileSubscriptionEnd:', profileSubscriptionEnd)
    console.log('✅ [Payment Check] hasPayment:', !!payment)
    console.log('✅ [Payment Check] payment status:', payment?.status)
    console.log('✅ [Payment Check] hasSubscription:', hasActiveSubscription)
    console.log('✅ [Payment Check] subscription status:', subscription?.status)
    console.log('✅ [Payment Check] userId:', user.id)
    console.log('✅ [Payment Check] ==========================================')

    // IMPORTANTE: Retornar headers para evitar cache
    return NextResponse.json({
      hasActivePayment,
      hasPayment: !!payment,
      hasSubscription: hasActiveSubscription
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    })
  } catch (error: any) {
    return NextResponse.json({
      hasActivePayment: false,
      hasPayment: false,
      hasSubscription: false
    })
  }
}

