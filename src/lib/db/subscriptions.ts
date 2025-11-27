import { supabase } from '@/lib/supabase/client'
import { Database } from '@/types/database'

type Subscription = Database['public']['Tables']['subscriptions']['Row']
type SubscriptionInsert = Database['public']['Tables']['subscriptions']['Insert']

export async function getCurrentUserSubscription(): Promise<Subscription | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return null

    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No subscription found
        return null
      }
      console.error('Error fetching subscription:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in getCurrentUserSubscription:', error)
    return null
  }
}

export async function getCurrentUserSubscriptionWithPlan() {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return null

    const { data, error } = await supabase
      .from('subscriptions')
      .select(`
        *,
        plan:plans(*)
      `)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      console.error('Error fetching subscription with plan:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in getCurrentUserSubscriptionWithPlan:', error)
    return null
  }
}

export async function getPaymentHistory(userId: string) {
  try {
    // This would typically come from a payments table
    // For now, we'll return subscription history
    const { data, error } = await supabase
      .from('subscriptions')
      .select(`
        *,
        plan:plans(name, price_monthly_cents)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) throw error

    return data?.map((sub: any) => ({
      id: sub.id,
      date: sub.started_at,
      plan: sub.plan?.name || 'Free',
      amount: (sub.plan?.price_monthly_cents || 0) / 100,
      status: sub.status === 'active' ? 'completed' : 'pending',
      invoice: `#INV-${sub.id.substring(0, 8).toUpperCase()}`,
    })) || []
  } catch (error) {
    console.error('Error fetching payment history:', error)
    return []
  }
}

export async function createSubscription(
  userId: string,
  planId: string
): Promise<Subscription | null> {
  try {
    // Calculate period end (30 days from now)
    const currentPeriodEnd = new Date()
    currentPeriodEnd.setDate(currentPeriodEnd.getDate() + 30)

    const subscriptionData: SubscriptionInsert = {
      user_id: userId,
      plan_id: planId,
      status: 'active',
      current_period_end: currentPeriodEnd.toISOString(),
    }

    const { data, error } = await supabase
      .from('subscriptions')
      .insert(subscriptionData)
      .select()
      .single()

    if (error) throw error

    return data
  } catch (error) {
    console.error('Error creating subscription:', error)
    throw error
  }
}

export async function updateSubscription(
  subscriptionId: string,
  updates: Partial<Subscription>
): Promise<Subscription | null> {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .update(updates)
      .eq('id', subscriptionId)
      .select()
      .single()

    if (error) throw error

    return data
  } catch (error) {
    console.error('Error updating subscription:', error)
    throw error
  }
}

