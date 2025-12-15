import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

const CLIENT_ID = '9f903862-a780-440d-8ed5-b8d8090b180e'
// Token atualizado fornecido pelo usuário (válido até 2025-09-23)
const DEFAULT_TOKEN = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiI5ZjkwMzg2Mi1hNzgwLTQ0MGQtOGVkNS1iOGQ4MDkwYjE4MGUiLCJqdGkiOiIxNTdmMTM4NDZiNjUwMDUxYzg3ODQ1NDc5ZjQ4NmQwNGU5MDIxMTBmOWNjNDJlNWNlMmQxOTg3ZjQ0Y2MzOThiM2VmYjYyYmI4OWNiYjk5NSIsImlhdCI6MTc1NDg2MzIzMS41MjQ0NDksIm5iZiI6MTc1NDg2MzIzMS41MjQ0NTEsImV4cCI6MTc4NjM5OTIzMS41MjE1MDMsInN1YiI6IiIsInNjb3BlcyI6W119.sSGP5ncLSw-OOp3hW7YQpFtXcXqnheEIAt1G3Nn8-v-ajgtyV8EE9yrbV_rLlTHvMZfs7p-0VNe8yrWXLwWj8CPgyVFzutX918uEdPHODz-osU8ROYWE5-IMrADwuQ8JA1IHQZKXp9jj41bxVhYqcvMmBrH_Tt2tKKa4JHunYlD_xgjWgNLmHArq31J5iyC8_jNR6LWDTqx7ohWX0LIuQ3mXfl8WKFAmx06YzWHWG4kNFLZZzsd1e-UVP_WqmTQ-ptX_nOA3AelV5xFJGM_i__cghWM3TQUX6Wx4JD3YolHyU3C7G7Z6HtFQ-_Jb2JE4kHZGMmu-85NJgcQS6FbVIkI6ZWSoWI_DsjtdkYMo-Sbz4m-9rYPRXVocsz0rSAMeV-BQkm6Vh-ux7a5j677eumdvz6Osdp08BjpkJ25ZHN6wQru0JCjSCiTasfY7BPYxdWi4JWD4Xec4Ssvi1XzD2M7_pQ_QJ0JGaWyU3jez4IpYyFjw7CZO7aWi-SAFZPNuXZ04V0qXqmpVH-2Q5w7O29-zdkEYwvmJfPcokFGzRJpvseXxfxnOSjHuZxOAJ_J8aBXRyswXfz0ID3xqWjzj53wvVOCjowzMBrfMYJeR4u72ODxO2zey0E3Lux7zdTBCbqLB5J45DmACfWmXY1G9--bIbBq4lSTIcqwrkXbV9pM'
const MPESA_WALLET_ID = '993607'
const EMOLA_WALLET_ID = '993606'

export async function POST(request: NextRequest) {
  try {
    let user = null
    let authError: any = null
    
    // Primeiro tentar via cookies
    const supabase = await createClient()
    const { data: { user: userFromCookies }, error: cookieError } = await supabase.auth.getUser()
    
    if (userFromCookies && !cookieError) {
      user = userFromCookies
    } else {
      authError = cookieError
      // Se não conseguir via cookies, tentar via header
      const authHeader = request.headers.get('authorization') || request.headers.get('Authorization')
      
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7)
        
        try {
          // Validar token diretamente com Supabase (seguindo padrão de outras APIs)
          const supabaseModule = await import('@supabase/supabase-js')
          const createSupabaseClient = supabaseModule.createClient
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
          const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
          
          if (!supabaseUrl || !supabaseAnonKey) {
            authError = new Error('Configuração inválida')
          } else {
            // Criar cliente com token no header global (padrão usado em outras APIs)
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
              authError = null
            } else {
              authError = tokenError || new Error('Token inválido')
            }
          }
        } catch (error: any) {
          authError = error
        }
      } else {
        authError = new Error('Token não encontrado')
      }
    }

    if (!user) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Não autenticado. Faça login para continuar.",
          error: authError?.message || 'Autenticação falhou'
        },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { amount, phone, method, reference, plan, months } = body

    // Validações
    if (!['mpesa', 'emola'].includes(method)) {
      return NextResponse.json(
        { success: false, message: 'Método de pagamento inválido' },
        { status: 400 }
      )
    }

    const phoneDigits = phone.replace(/\D/g, '')
    if (!/^(84|85|86|87)\d{7}$/.test(phoneDigits)) {
      return NextResponse.json(
        { success: false, message: 'Telefone inválido. Use um número válido de Moçambique (84, 85, 86 ou 87) com 9 dígitos' },
        { status: 400 }
      )
    }

    const amountNum = Number(amount)
    if (amountNum < 1 || isNaN(amountNum)) {
      return NextResponse.json(
        { success: false, message: 'Valor mínimo é 1 MZN' },
        { status: 400 }
      )
    }

    // Limpar referência
    let cleanReference = reference.replace(/[^a-zA-Z0-9_]/g, '').substring(0, 20)
    if (!cleanReference) {
      cleanReference = `Payment-${Date.now()}`
    }

    // Obter credenciais (priorizar variáveis de ambiente)
    const envTokenKey = method === 'mpesa' ? 'MPESA_ACCESS_TOKEN' : 'EMOLA_ACCESS_TOKEN'
    const accessToken = process.env[envTokenKey] || DEFAULT_TOKEN
    const walletId = method === 'mpesa'
      ? (process.env.MPESA_WALLET_ID || MPESA_WALLET_ID)
      : (process.env.EMOLA_WALLET_ID || EMOLA_WALLET_ID)

    // Token já obtido acima

    // Montar URL da API
    const apiUrl = `https://mpesaemolatech.com/v1/c2b/${method}-payment/${walletId}`

    // Fazer requisição para API e-Mola/M-Pesa
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 segundos

    try {
      const apiResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: CLIENT_ID,
          amount: amountNum,
          phone: phoneDigits,
          reference: cleanReference,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      console.log('📥 [Payment API] Resposta recebida:', {
        status: apiResponse.status,
        statusText: apiResponse.statusText,
        ok: apiResponse.ok
      })

      const responseData = await apiResponse.json()
      
      console.log('📦 [Payment API] Dados da resposta:', {
        hasTransactionId: !!responseData.transaction_id,
        hasReference: !!responseData.reference,
        message: responseData.message,
        error: responseData.error,
        success: responseData.success,
        fullResponse: responseData
      })

      // Verificar se pagamento foi bem-sucedido (status 200/201 OU success na resposta)
      const isSuccess = apiResponse.status === 200 || 
                       apiResponse.status === 201 || 
                       responseData.success === true ||
                       (typeof responseData.success === 'string' && responseData.success.toLowerCase().includes('sucesso')) ||
                       (responseData.message && responseData.message.toLowerCase().includes('sucesso'))
      
      console.log('🔍 [Payment API] Verificando sucesso:', {
        status: apiResponse.status,
        hasSuccess: !!responseData.success,
        successValue: responseData.success,
        hasMessage: !!responseData.message,
        messageValue: responseData.message,
        isSuccess: isSuccess
      })
      
      if (isSuccess) {
        const transactionId = responseData.transaction_id || 
                              responseData.reference || 
                              responseData.id || 
                              responseData.transactionId ||
                              cleanReference

        const adminClient = createAdminClient()
        const now = new Date()
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + (months * 30))

        // 1. ATIVAR CONTA NO PERFIL (VERIFICAR SE FUNCIONOU)
        const { error: profileError, data: updatedProfile } = await (adminClient.from('profiles') as any)
          .update({
            has_active_subscription: true,
            subscription_ends_at: expiresAt.toISOString(),
          })
          .eq('id', user.id)
          .select('id, has_active_subscription')
          .single()

        if (profileError) {
          console.error('❌ [Payment API] ERRO ao ativar perfil:', profileError)
          return NextResponse.json({
            success: false,
            message: 'Erro ao ativar conta. Entre em contato com suporte.',
            transaction_id: transactionId,
            error: profileError.message
          }, { status: 500 })
        }

        if (!updatedProfile || updatedProfile.has_active_subscription !== true) {
          console.error('❌ [Payment API] Perfil não foi atualizado corretamente')
          return NextResponse.json({
            success: false,
            message: 'Erro ao ativar conta. Entre em contato com suporte.',
            transaction_id: transactionId
          }, { status: 500 })
        }

        // 2. BUSCAR PLAN_ID
        const { data: planData, error: planError } = await (adminClient
          .from('plans') as any)
          .select('id')
          .eq('is_active', true)
          .limit(1)
          .maybeSingle()

        if (planError || !planData) {
          console.error('❌ [Payment API] Erro ao buscar plano:', planError)
          // Continuar mesmo sem planId - o importante é ativar a conta
        }

        const planId = planData?.id

        // 3. CRIAR/ATUALIZAR SUBSCRIPTION (OBRIGATÓRIO)
        let subscriptionCreated = false
        if (planId) {
          console.log('🔍 [Payment API] Tentando criar/atualizar subscription:', {
            userId: user.id,
            planId: planId,
            status: 'active',
            started_at: now.toISOString(),
            current_period_end: expiresAt.toISOString()
          })

          // Primeiro verificar se já existe
          const { data: existingSub } = await (adminClient.from('subscriptions') as any)
            .select('id, status')
            .eq('user_id', user.id)
            .maybeSingle()

          let subData: any = null
          let subError: any = null

          if (existingSub) {
            // Atualizar existente
            console.log('🔄 [Payment API] Subscription já existe, atualizando:', existingSub.id)
            const result = await (adminClient.from('subscriptions') as any)
              .update({
                plan_id: planId,
                status: 'active',
                started_at: now.toISOString(),
                current_period_end: expiresAt.toISOString(),
                updated_at: now.toISOString(),
              })
              .eq('id', existingSub.id)
              .select('id, status, user_id')
              .single()
            
            subData = result.data
            subError = result.error
          } else {
            // Criar nova
            console.log('➕ [Payment API] Criando nova subscription')
            const result = await (adminClient.from('subscriptions') as any)
              .insert({
                user_id: user.id,
                plan_id: planId,
                status: 'active',
                started_at: now.toISOString(),
                current_period_end: expiresAt.toISOString(),
              })
              .select('id, status, user_id')
              .single()
            
            subData = result.data
            subError = result.error
          }

          if (subError) {
            console.error('❌ [Payment API] ERRO ao criar/atualizar subscription:', {
              error: subError,
              code: subError?.code,
              message: subError?.message,
              details: subError?.details,
              hint: subError?.hint
            })
            return NextResponse.json({
              success: false,
              message: 'Erro ao criar assinatura. Entre em contato com suporte.',
              transaction_id: transactionId,
              error: subError.message
            }, { status: 500 })
          }
          
          if (subData && subData.status === 'active') {
            subscriptionCreated = true
            console.log('✅ [Payment API] Subscription criada/atualizada com SUCESSO:', {
              id: subData.id,
              status: subData.status,
              user_id: subData.user_id
            })
          } else {
            console.error('❌ [Payment API] Subscription não foi criada corretamente:', subData)
          }
        } else {
          console.warn('⚠️ [Payment API] PlanId não encontrado, pulando subscription')
        }

        // 4. CRIAR PAGAMENTO (OBRIGATÓRIO)
        let paymentCreated = false
        if (planId) {
          console.log('🔍 [Payment API] Tentando criar payment:', {
            userId: user.id,
            planId: planId,
            amount_cents: Math.round(amountNum * 100),
            transaction_id: transactionId
          })

          const { data: paymentData, error: paymentError } = await (adminClient.from('payments') as any)
            .insert({
              user_id: user.id,
              plan_id: planId,
              amount_cents: Math.round(amountNum * 100),
              currency: 'MZN',
              status: 'completed',
              paid_at: now.toISOString(),
              transaction_id: transactionId,
              period_start: now.toISOString(),
              period_end: expiresAt.toISOString(),
            })
            .select('id, status, user_id, transaction_id')
            .single()

          if (paymentError) {
            console.error('❌ [Payment API] ERRO ao criar payment:', {
              error: paymentError,
              code: paymentError?.code,
              message: paymentError?.message,
              details: paymentError?.details,
              hint: paymentError?.hint
            })
            
            // Se erro de duplicata, tentar buscar
            if (paymentError.code === '23505') { // Unique violation
              const { data: existingPayment } = await (adminClient.from('payments') as any)
                .select('id, status')
                .eq('user_id', user.id)
                .eq('transaction_id', transactionId)
                .maybeSingle()
              
              if (existingPayment) {
                paymentCreated = true
                console.log('✅ [Payment API] Payment já existe:', existingPayment.id)
              } else {
                return NextResponse.json({
                  success: false,
                  message: 'Erro ao registrar pagamento. Entre em contato com suporte.',
                  transaction_id: transactionId,
                  error: paymentError.message
                }, { status: 500 })
              }
            } else {
              return NextResponse.json({
                success: false,
                message: 'Erro ao registrar pagamento. Entre em contato com suporte.',
                transaction_id: transactionId,
                error: paymentError.message
              }, { status: 500 })
            }
          } else if (paymentData && paymentData.status === 'completed') {
            paymentCreated = true
            console.log('✅ [Payment API] Payment criado com SUCESSO:', {
              id: paymentData.id,
              status: paymentData.status,
              user_id: paymentData.user_id,
              transaction_id: paymentData.transaction_id
            })
          } else {
            console.error('❌ [Payment API] Payment não foi criado corretamente:', paymentData)
          }
        } else {
          console.warn('⚠️ [Payment API] PlanId não encontrado, pulando payment')
        }

        // 5. VERIFICAR FINAL: Confirmar que TUDO foi criado/ativado
        const { data: finalCheck, error: checkError } = await (adminClient
          .from('profiles') as any)
          .select('has_active_subscription, subscription_ends_at')
          .eq('id', user.id)
          .single()

        if (checkError || !finalCheck || finalCheck.has_active_subscription !== true) {
          console.error('❌ [Payment API] Verificação final do perfil falhou:', checkError)
          return NextResponse.json({
            success: false,
            message: 'Erro ao confirmar ativação da conta. Entre em contato com suporte.',
            transaction_id: transactionId
          }, { status: 500 })
        }

        // 6. VERIFICAR FINAL: Buscar TUDO do banco para confirmar
        console.log('🔍 [Payment API] ========== VERIFICAÇÃO FINAL DO BANCO ==========')
        
        // Verificar perfil
        const { data: verifyProfile, error: verifyProfileError } = await (adminClient
          .from('profiles') as any)
          .select('id, has_active_subscription, subscription_ends_at')
          .eq('id', user.id)
          .single()

        console.log('🔍 [Payment API] Perfil no banco:', {
          exists: !!verifyProfile,
          has_active_subscription: verifyProfile?.has_active_subscription,
          error: verifyProfileError?.message
        })

        // Verificar payment
        let verifyPayment: any = null
        if (planId) {
          const { data: paymentFromDb, error: paymentError } = await (adminClient.from('payments') as any)
            .select('id, status, user_id, transaction_id')
            .eq('user_id', user.id)
            .eq('transaction_id', transactionId)
            .maybeSingle()

          verifyPayment = paymentFromDb
          console.log('🔍 [Payment API] Payment no banco:', {
            exists: !!verifyPayment,
            id: verifyPayment?.id,
            status: verifyPayment?.status,
            transaction_id: verifyPayment?.transaction_id,
            error: paymentError?.message
          })
        }

        // Verificar subscription
        let verifySub: any = null
        if (planId) {
          const { data: subFromDb, error: subError } = await (adminClient.from('subscriptions') as any)
            .select('id, status, user_id, plan_id')
            .eq('user_id', user.id)
            .maybeSingle()

          verifySub = subFromDb
          console.log('🔍 [Payment API] Subscription no banco:', {
            exists: !!verifySub,
            id: verifySub?.id,
            status: verifySub?.status,
            user_id: verifySub?.user_id,
            plan_id: verifySub?.plan_id,
            error: subError?.message
          })
        }

        // Verificar se tudo está OK
        const perfilOk = verifyProfile?.has_active_subscription === true
        const paymentOk = planId ? (!!verifyPayment && ['completed', 'confirmed', 'paid'].includes(verifyPayment.status)) : true
        const subscriptionOk = planId ? (!!verifySub && verifySub.status === 'active') : true

        const tudoAtivado = perfilOk && paymentOk && subscriptionOk

        console.log('🔍 [Payment API] Resultado da verificação:', {
          perfilOk,
          paymentOk,
          subscriptionOk,
          tudoAtivado
        })
        console.log('🔍 [Payment API] ================================================')

        if (!tudoAtivado) {
          console.error('❌ [Payment API] VERIFICAÇÃO FALHOU! Nem tudo foi ativado:', {
            perfilOk,
            paymentOk,
            subscriptionOk
          })
          return NextResponse.json({
            success: false,
            message: 'Alguns dados não foram ativados corretamente. Entre em contato com suporte.',
            transaction_id: transactionId,
            verificacoes: {
              perfil: perfilOk,
              payment: paymentOk,
              subscription: subscriptionOk
            }
          }, { status: 500 })
        }

        // Enviar email (opcional, não bloqueia)
        try {
          const { data: profile } = await (adminClient
            .from('profiles') as any)
            .select('name, email')
            .eq('id', user.id)
            .single()

          if (profile?.email) {
            fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/email/payment-confirmation`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: profile.email,
                name: profile.name || user.email,
                plan: plan,
                amount: amountNum,
                expiresAt: expiresAt.toISOString(),
                transactionId: transactionId,
              }),
            }).catch(() => {}) // Ignorar erro de email
          }
        } catch (e) {
          // Ignorar erro de email
        }
        
        return NextResponse.json({
          success: true,
          transaction_id: transactionId,
          reference: responseData.reference || cleanReference,
          message: 'Pagamento processado com sucesso. Sua conta foi ativada.',
          account_activated: true,
        }, { status: 200 })
      } else {
        // Mensagens específicas para diferentes erros
        let errorMessage = 'Erro ao processar pagamento. Tente novamente.'
        let errorType = 'api_external_error'
        
        if (apiResponse.status === 401) {
          errorMessage = 'Erro de autenticação. Tente novamente mais tarde.'
          errorType = 'token_expired'
        } else if (apiResponse.status === 422) {
          // Erro 422 = Saldo insuficiente
          errorMessage = 'Saldo insuficiente na sua conta. Por favor, recarregue sua conta M-Pesa/e-Mola e tente novamente.'
          errorType = 'insufficient_balance'
        } else if (apiResponse.status === 400) {
          // Erro 400 = PIN não confirmado ou incorreto
          errorMessage = 'PIN não confirmado. Por favor, confirme o pagamento no seu celular inserindo o PIN.'
          errorType = 'pin_error'
        }
        
        return NextResponse.json(
          {
            success: false,
            message: errorMessage,
            status: apiResponse.status,
            error_type: errorType
          },
          { status: apiResponse.status }
        )
      }
    } catch (fetchError: any) {
      clearTimeout(timeoutId)
      
      if (fetchError.name === 'AbortError') {
        return NextResponse.json(
          { 
            success: false, 
            message: 'Tempo de espera excedido. Tente novamente.',
            error_type: 'timeout'
          },
          { status: 408 }
        )
      }

      return NextResponse.json(
        {
          success: false,
          message: 'Erro ao conectar com a API de pagamento. Tente novamente.',
          error_type: 'network_error'
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: 'Erro ao processar pagamento. Tente novamente.',
        status: 500,
      },
      { status: 500 }
    )
  }
}

