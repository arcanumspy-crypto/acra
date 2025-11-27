import { supabase as browserClient } from "@/lib/supabase/client"
import { createAdminClient } from "@/lib/supabase/admin"
import { Database } from "@/types/database"

// Import dinâmico do server client para evitar erro em Client Components
async function getServerClient() {
  try {
    const { createClient } = await import("@/lib/supabase/server")
    return await createClient()
  } catch (error) {
    // Se falhar (Client Component), retornar null para usar browser client
    return null
  }
}

type CreditPackage = Database['public']['Tables']['credit_packages']['Row']
type UserCredits = Database['public']['Tables']['user_credits']['Row']
type CreditTransaction = Database['public']['Tables']['credit_transactions']['Row']

export interface CreditBalance {
  balance: number
  total_loaded: number
  total_consumed: number
  is_blocked: boolean
  low_balance_threshold: number
}

export interface CreditTransactionWithMetadata extends CreditTransaction {
  package?: CreditPackage | null
  user_name?: string
  user_email?: string
}

export interface CreditStats {
  total_users_with_credits: number
  total_credits_loaded: number
  total_credits_consumed: number
  users_with_negative_balance: number
  total_debt: number
}

/**
 * Obter saldo de créditos do usuário atual
 * Funciona tanto em Server Components quanto em Client Components
 */
export async function getUserCreditBalance(userId: string): Promise<CreditBalance | null> {
  try {
    // Tentar usar server client primeiro (se estiver em Server Component)
    const serverClient = await getServerClient()
    const supabase = serverClient || browserClient
    
    const { data, error } = await supabase
      .from('user_credits')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      // Se não existe, criar registro
      if (error.code === 'PGRST116') {
        const { data: newRecord, error: insertError } = await supabase
          .from('user_credits')
          .insert({
            user_id: userId,
            balance: 0,
            total_loaded: 0,
            total_consumed: 0,
          })
          .select()
          .single()
        
        if (insertError) throw insertError
        return newRecord as CreditBalance
      }
      throw error
    }

    return data as CreditBalance
  } catch (error) {
    console.error('Error getting user credit balance:', error)
    return null
  }
}

/**
 * Carregar créditos (compra de pacote ou customizada)
 */
export async function loadCredits(
  userId: string,
  packageId: string,
  paymentId?: string,
  customValues?: { credits: number; price_cents: number }
): Promise<{ success: boolean; transactionId?: string; error?: string }> {
  console.log('🚀 [loadCredits] ========== INÍCIO ==========')
  console.log('📥 [loadCredits] Parâmetros recebidos:', {
    userId,
    packageId,
    paymentId: paymentId || '(não fornecido)'
  })

  try {
    console.log('📦 [loadCredits] Criando adminClient...')
    const adminClient = createAdminClient()
    console.log('✅ [loadCredits] AdminClient criado com sucesso')
    
    // Verificar saldo ANTES
    console.log('📊 [loadCredits] Verificando saldo ANTES da operação...')
    const { data: balanceBefore, error: balanceBeforeError } = await adminClient
      .from('user_credits')
      .select('balance, total_loaded, total_consumed, updated_at')
      .eq('user_id', userId)
      .single()
    
    if (balanceBeforeError) {
      console.log('⚠️ [loadCredits] Erro ao buscar saldo antes (pode ser normal se não existir):', balanceBeforeError.message)
    }
    console.log('📊 [loadCredits] Saldo ANTES:', balanceBefore || 'Registro não existe ainda')
    
    // Buscar pacote
    console.log('🔍 [loadCredits] Buscando pacote de créditos...', { packageId })
    const { data: packageData, error: packageError } = await adminClient
      .from('credit_packages')
      .select('*')
      .eq('id', packageId)
      .eq('is_active', true)
      .single()

    if (packageError) {
      console.error('❌ [loadCredits] Erro ao buscar pacote:', packageError)
      console.error('   Código:', packageError.code)
      console.error('   Mensagem:', packageError.message)
      console.error('   Detalhes:', packageError.details)
      return { success: false, error: `Erro ao buscar pacote: ${packageError.message}` }
    }

    if (!packageData) {
      console.error('❌ [loadCredits] Pacote não encontrado:', { packageId })
      return { success: false, error: 'Pacote não encontrado' }
    }

    console.log('✅ [loadCredits] Pacote encontrado:', {
      id: packageData.id,
      name: packageData.name,
      credits: packageData.credits,
      bonus_credits: packageData.bonus_credits || 0
    })

    // Se houver valores customizados, usar eles; senão usar do pacote
    const creditsToAdd = customValues ? customValues.credits : packageData.credits
    const bonusCredits = customValues ? 0 : (packageData.bonus_credits || 0)
    const totalCredits = creditsToAdd + bonusCredits
    const priceCents = customValues ? customValues.price_cents : packageData.price_cents
    
    console.log('💰 [loadCredits] Total de créditos a adicionar:', totalCredits, customValues ? '(customizado)' : '(pacote)')

    // IMPORTANTE: payment_id agora é sempre TEXT (string) na função SQL
    // Passar como string mesmo se for UUID ou demo_payment_id
    const paymentIdAsText: string | null = paymentId 
      ? String(paymentId) 
      : null

    console.log('🔧 [loadCredits] Payment ID processado:', {
      original: paymentId,
      asText: paymentIdAsText,
      isNull: paymentIdAsText === null
    })

    const metadata = {
      package_name: customValues ? `Compra Customizada (${creditsToAdd} créditos)` : packageData.name,
      base_credits: creditsToAdd,
      bonus_credits: bonusCredits,
      price_cents: priceCents,
      is_custom: !!customValues,
      // Salvar payment_id original no metadata para referência
      ...(paymentId ? { original_payment_id: paymentId } : {})
    }

    console.log('📋 [loadCredits] Metadata preparado:', metadata)

    // Preparar parâmetros RPC
    const rpcParams = {
      p_user_id: userId,
      p_amount: totalCredits,
      p_category: 'purchase',
      p_description: customValues 
        ? `Compra customizada - ${creditsToAdd} créditos`
        : `Compra de ${packageData.name} - ${packageData.credits} créditos${packageData.bonus_credits > 0 ? ` + ${packageData.bonus_credits} bônus` : ''}`,
      p_package_id: packageId,
      p_payment_id: paymentIdAsText, // Sempre TEXT (string) ou null - compatível com migração 022
      p_metadata: metadata
    }

    console.log('🔄 [loadCredits] Chamando função RPC add_credits...')
    console.log('📤 [loadCredits] Parâmetros RPC:', JSON.stringify(rpcParams, null, 2))

    const { data: transactionData, error: transactionError } = await adminClient
      .rpc('add_credits', rpcParams)

    if (transactionError) {
      console.error('❌ [loadCredits] ERRO na chamada RPC:')
      console.error('   Código:', transactionError.code)
      console.error('   Mensagem:', transactionError.message)
      console.error('   Detalhes:', transactionError.details)
      console.error('   Hint:', transactionError.hint)
      console.error('   Erro completo:', JSON.stringify(transactionError, null, 2))
      return { success: false, error: transactionError.message || 'Erro ao carregar créditos' }
    }

    console.log('✅ [loadCredits] RPC executado com sucesso!')
    console.log('   Transaction ID retornado:', transactionData)
    console.log('   Tipo do transactionData:', typeof transactionData)

    // Verificar se a transação foi realmente criada
    if (!transactionData) {
      console.error('⚠️ [loadCredits] A função retornou sem transactionId')
      return { success: false, error: 'Transação não foi criada' }
    }

    // Aguardar um pouco para garantir que a transação foi commitada
    console.log('⏳ [loadCredits] Aguardando 500ms para garantir commit...')
    await new Promise(resolve => setTimeout(resolve, 500))

    // Verificar se o saldo foi atualizado
    console.log('🔍 [loadCredits] Verificando saldo DEPOIS da operação...')
    const { data: balanceAfter, error: balanceAfterError } = await adminClient
      .from('user_credits')
      .select('balance, total_loaded, total_consumed, updated_at')
      .eq('user_id', userId)
      .single()

    if (balanceAfterError) {
      console.error('❌ [loadCredits] Erro ao verificar saldo depois:', balanceAfterError)
    } else {
      console.log('📊 [loadCredits] Saldo DEPOIS:', balanceAfter)
      console.log('📈 [loadCredits] Comparação de saldos:', {
        antes: balanceBefore?.balance || 0,
        depois: balanceAfter?.balance || 0,
        esperado: (balanceBefore?.balance || 0) + totalCredits,
        correto: balanceAfter?.balance === ((balanceBefore?.balance || 0) + totalCredits),
        diferenca: (balanceAfter?.balance || 0) - (balanceBefore?.balance || 0)
      })
    }

    // Verificar se a transação foi criada no banco
    console.log('🔍 [loadCredits] Verificando se transação foi criada no banco...')
    const { data: transactionCheck, error: transactionCheckError } = await adminClient
      .from('credit_transactions')
      .select('id, amount, balance_before, balance_after, created_at, payment_id')
      .eq('id', transactionData)
      .single()

    if (transactionCheckError) {
      console.error('❌ [loadCredits] Erro ao verificar transação:', transactionCheckError)
    } else {
      console.log('✅ [loadCredits] Transação encontrada no banco:', transactionCheck)
    }

    console.log('✅ [loadCredits] ========== SUCESSO ==========')
    return { success: true, transactionId: transactionData }
  } catch (error: any) {
    console.error('💥 [loadCredits] ========== ERRO CRÍTICO ==========')
    console.error('   Tipo:', error.constructor.name)
    console.error('   Mensagem:', error.message)
    console.error('   Stack:', error.stack)
    console.error('   Erro completo:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2))
    return { success: false, error: error.message || 'Erro ao carregar créditos' }
  }
}

/**
 * Debitar créditos (consumo)
 */
export async function debitCredits(
  userId: string,
  amount: number,
  category: 'offer_view' | 'copy_generation' | 'audio_generation',
  description: string,
  metadata?: Record<string, any>,
  allowNegative: boolean = true
): Promise<{ success: boolean; transactionId?: string; balanceAfter?: number; error?: string }> {
  try {
    const adminClient = createAdminClient()
    
    // Usar função SQL para debitar créditos
    const { data: transactionData, error: transactionError } = await adminClient
      .rpc('debit_credits', {
        p_user_id: userId,
        p_amount: amount,
        p_category: category,
        p_description: description,
        p_metadata: metadata || null,
        p_allow_negative: allowNegative
      })

    if (transactionError) {
      // Se saldo insuficiente e não permite negativo
      if (transactionError.message.includes('Saldo insuficiente')) {
        return { success: false, error: 'Saldo insuficiente' }
      }
      console.error('Error debiting credits:', transactionError)
      return { success: false, error: transactionError.message }
    }

    // Obter saldo atualizado
    const { data: balanceData } = await adminClient
      .from('user_credits')
      .select('balance')
      .eq('user_id', userId)
      .single()

    // Registrar atividade em user_activities (se a tabela existir)
    try {
      const activityType = category === 'offer_view' ? 'OFFER_VIEW' 
        : category === 'copy_generation' ? 'COPY_GENERATION'
        : category === 'audio_generation' ? 'AUDIO_GENERATION'
        : 'CREDIT_DEBIT'

      await adminClient
        .from('user_activities')
        .insert({
          user_id: userId,
          type: activityType,
          offer_id: metadata?.offer_id || null,
          credits_used: amount,
          metadata: metadata || {}
        })
        .catch((err) => {
          // Se a tabela não existir, apenas logar (não bloquear)
          if (err.code !== '42P01' && err.code !== 'PGRST202') {
            console.warn('⚠️ Erro ao registrar atividade:', err.message)
          }
        })
    } catch (activityError: any) {
      // Ignorar erro se tabela não existir
      if (activityError?.code !== '42P01' && activityError?.code !== 'PGRST202') {
        console.warn('⚠️ Erro ao registrar atividade:', activityError.message)
      }
    }

    return {
      success: true,
      transactionId: transactionData,
      balanceAfter: balanceData?.balance || 0
    }
  } catch (error: any) {
    console.error('Error in debitCredits:', error)
    return { success: false, error: error.message || 'Erro ao debitar créditos' }
  }
}

/**
 * Obter histórico de transações do usuário
 */
export async function getUserCreditTransactions(
  userId: string,
  limit: number = 50,
  offset: number = 0
): Promise<CreditTransactionWithMetadata[]> {
  try {
    // Tentar usar server client primeiro (se estiver em Server Component)
    const serverClient = await getServerClient()
    const supabase = serverClient || browserClient
    
    const { data, error } = await supabase
      .from('credit_transactions')
      .select(`
        *,
        package:credit_packages(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    return (data || []) as CreditTransactionWithMetadata[]
  } catch (error) {
    console.error('Error getting user credit transactions:', error)
    return []
  }
}

/**
 * Obter pacotes de créditos disponíveis
 */
export async function getCreditPackages(): Promise<CreditPackage[]> {
  try {
    // Tentar usar server client primeiro (se estiver em Server Component)
    const serverClient = await getServerClient()
    const supabase = serverClient || browserClient
    
    const { data, error } = await supabase
      .from('credit_packages')
      .select('*')
      .eq('is_active', true)
      .order('credits', { ascending: true })

    if (error) throw error

    return (data || []) as CreditPackage[]
  } catch (error) {
    console.error('Error getting credit packages:', error)
    return []
  }
}

/**
 * Verificar se usuário tem créditos suficientes
 */
export async function hasSufficientCredits(
  userId: string,
  amount: number
): Promise<{ sufficient: boolean; balance: number }> {
  try {
    const balance = await getUserCreditBalance(userId)
    if (!balance) {
      return { sufficient: false, balance: 0 }
    }
    
    return {
      sufficient: balance.balance >= amount,
      balance: balance.balance
    }
  } catch (error) {
    console.error('Error checking sufficient credits:', error)
    return { sufficient: false, balance: 0 }
  }
}

/**
 * ADMIN: Obter estatísticas gerais de créditos
 */
export async function getCreditStats(): Promise<CreditStats> {
  try {
    const adminClient = createAdminClient()
    
    // Total de usuários com créditos
    const { count: totalUsers } = await adminClient
      .from('user_credits')
      .select('*', { count: 'exact', head: true })

    // Total de créditos carregados
    const { data: loadedData } = await adminClient
      .from('credit_transactions')
      .select('amount')
      .eq('type', 'credit')
      .eq('category', 'purchase')
    
    const totalLoaded = loadedData?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0

    // Total de créditos consumidos
    const { data: consumedData } = await adminClient
      .from('credit_transactions')
      .select('amount')
      .eq('type', 'debit')
    
    const totalConsumed = consumedData?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0

    // Usuários com saldo negativo
    const { data: negativeUsers } = await adminClient
      .from('user_credits')
      .select('balance')
      .lt('balance', 0)
    
    const usersWithNegative = negativeUsers?.length || 0
    const totalDebt = Math.abs(negativeUsers?.reduce((sum, u) => sum + (u.balance || 0), 0) || 0)

    return {
      total_users_with_credits: totalUsers || 0,
      total_credits_loaded: totalLoaded,
      total_credits_consumed: totalConsumed,
      users_with_negative_balance: usersWithNegative,
      total_debt: totalDebt
    }
  } catch (error) {
    console.error('Error getting credit stats:', error)
    return {
      total_users_with_credits: 0,
      total_credits_loaded: 0,
      total_credits_consumed: 0,
      users_with_negative_balance: 0,
      total_debt: 0
    }
  }
}

/**
 * ADMIN: Obter todos os usuários com saldo de créditos
 */
export async function getAllUsersWithCredits(): Promise<Array<UserCredits & { user_name?: string; user_email?: string }>> {
  try {
    const adminClient = createAdminClient()
    
    const { data, error } = await adminClient
      .from('user_credits')
      .select(`
        *,
        profile:profiles(name, email)
      `)
      .order('updated_at', { ascending: false })

    if (error) throw error

    return (data || []).map((item: any) => ({
      ...item,
      user_name: item.profile?.name,
      user_email: item.profile?.email
    }))
  } catch (error) {
    console.error('Error getting all users with credits:', error)
    return []
  }
}

/**
 * ADMIN: Obter transações de um usuário específico
 */
export async function getUserTransactionsForAdmin(
  userId: string,
  limit: number = 100
): Promise<CreditTransactionWithMetadata[]> {
  try {
    const adminClient = createAdminClient()
    
    const { data, error } = await adminClient
      .from('credit_transactions')
      .select(`
        *,
        package:credit_packages(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    return (data || []) as CreditTransactionWithMetadata[]
  } catch (error) {
    console.error('Error getting user transactions for admin:', error)
    return []
  }
}

/**
 * ADMIN: Obter usuários com saldo negativo (dívidas)
 */
export async function getUsersWithNegativeBalance(): Promise<Array<UserCredits & { user_name?: string; user_email?: string }>> {
  try {
    const adminClient = createAdminClient()
    
    const { data, error } = await adminClient
      .from('user_credits')
      .select(`
        *,
        profile:profiles(name, email)
      `)
      .lt('balance', 0)
      .order('balance', { ascending: true })

    if (error) throw error

    return (data || []).map((item: any) => ({
      ...item,
      user_name: item.profile?.name,
      user_email: item.profile?.email
    }))
  } catch (error) {
    console.error('Error getting users with negative balance:', error)
    return []
  }
}

/**
 * ADMIN: Bloquear/desbloquear usuário por dívida
 */
export async function setUserBlocked(userId: string, isBlocked: boolean): Promise<boolean> {
  try {
    const adminClient = createAdminClient()
    
    const { error } = await adminClient
      .from('user_credits')
      .update({ is_blocked: isBlocked })
      .eq('user_id', userId)

    if (error) throw error

    return true
  } catch (error) {
    console.error('Error setting user blocked:', error)
    return false
  }
}

/**
 * Verificar se usuário está bloqueado por dívida
 */
export async function isUserBlocked(userId: string): Promise<boolean> {
  try {
    const balance = await getUserCreditBalance(userId)
    return balance?.is_blocked || false
  } catch (error) {
    console.error('Error checking if user is blocked:', error)
    return false
  }
}

/**
 * Verificar se precisa alertar sobre saldo baixo
 */
export async function shouldAlertLowBalance(userId: string): Promise<{ should: boolean; balance: number; threshold: number }> {
  try {
    const balance = await getUserCreditBalance(userId)
    if (!balance) {
      return { should: false, balance: 0, threshold: 10 }
    }

    const threshold = balance.low_balance_threshold || 10
    const should = balance.balance <= threshold && balance.balance >= 0 // Só alertar se não estiver negativo ainda

    return {
      should,
      balance: balance.balance,
      threshold
    }
  } catch (error) {
    console.error('Error checking low balance alert:', error)
    return { should: false, balance: 0, threshold: 10 }
  }
}

/**
 * Marcar que usuário foi notificado sobre saldo baixo
 */
export async function markLowBalanceNotified(userId: string): Promise<boolean> {
  try {
    const adminClient = createAdminClient()
    
    const { error } = await adminClient
      .from('user_credits')
      .update({ last_notification_at: new Date().toISOString() })
      .eq('user_id', userId)

    if (error) throw error

    return true
  } catch (error) {
    console.error('Error marking low balance notified:', error)
    return false
  }
}




