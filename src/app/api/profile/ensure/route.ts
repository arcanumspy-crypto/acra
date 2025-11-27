import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Prevenir múltiplas chamadas simultâneas
let ensureInProgress = false

export async function POST(request: Request) {
  if (ensureInProgress) {
    return NextResponse.json(
      { error: 'Request already in progress' },
      { status: 429 }
    )
  }

  ensureInProgress = true

  try {
    const supabase = await createClient()
    
    // Get current user - try from cookies first
    let { data: { user }, error: authError } = await supabase.auth.getUser()
    
    // If that fails, try from Authorization header
    if (authError || !user) {
      const authHeader = request.headers.get('Authorization')
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7)
        const { data: { user: userFromToken }, error: tokenError } = await supabase.auth.getUser(token)
        if (!tokenError && userFromToken) {
          user = userFromToken
          authError = null
        }
      }
    }
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated', details: authError?.message || 'No user found' },
        { status: 401 }
      )
    }

    console.log('🔄 [Profile Ensure] Garantindo perfil para usuário:', {
      id: user.id,
      email: user.email
    })

    // Use admin client to bypass RLS
    let adminClient
    try {
      adminClient = createAdminClient()
    } catch (adminError: any) {
      console.warn('Admin client not available, using regular client:', adminError.message)
    }

    // Check if profile exists using admin client if available
    const checkClient = adminClient || supabase
    const { data: existingProfile, error: checkError } = await checkClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking profile:', checkError)
    }

    if (existingProfile) {
      console.log('✅ [Profile Ensure] Perfil encontrado:', {
        id: existingProfile.id,
        name: existingProfile.name,
        role: existingProfile.role,
        email: existingProfile.email
      })
      
      // Profile exists, update email and name if needed
      const updates: any = {}
      
      if (!existingProfile.email && user.email) {
        updates.email = user.email
      }
      
      if (!existingProfile.name) {
        updates.name = user.email?.split('@')[0] || 'User'
      }

      // Check if this user should be admin
      // Lista de emails admin
      const adminEmails = [
        'emenjoseph7+conta2@gmail.com',
        'emenmurromua@gmail.com', // Adicionar outros emails admin aqui
        'admin@swipevault.com'
      ]
      
      // SEMPRE verificar e atualizar role se necessário (mesmo que não haja outros updates)
      if (user.email && adminEmails.includes(user.email.toLowerCase())) {
        if (existingProfile.role !== 'admin') {
          console.log('🔑 [Profile Ensure] Definindo usuário como admin:', user.email)
          updates.role = 'admin'
        }
      }

      if (Object.keys(updates).length > 0) {
        const updateClient = adminClient || supabase
        const { data: updatedProfile, error: updateError } = await updateClient
          .from('profiles')
          .update(updates)
          .eq('id', user.id)
          .select()
          .single()

        if (updateError) {
          console.error('Error updating profile:', updateError)
          return NextResponse.json(
            { error: 'Failed to update profile', details: updateError },
            { status: 500 }
          )
        }

        return NextResponse.json({
          success: true,
          profile: updatedProfile,
          action: 'updated'
        })
      }

      return NextResponse.json({
        success: true,
        profile: existingProfile,
        action: 'exists'
      })
    } else {
      // Profile doesn't exist, create it using admin client
      const createClient = adminClient || supabase
      
      // Determine role
      const adminEmails = [
        'emenjoseph7+conta2@gmail.com',
        'emenmurromua@gmail.com', // Adicionar outros emails admin aqui
        'admin@swipevault.com'
      ]
      const role = (user.email && adminEmails.includes(user.email.toLowerCase())) ? 'admin' : 'user'
      console.log('🔑 [Profile Ensure] Criando perfil com role:', role, 'para:', user.email)
      
      const { data: newProfile, error: createError } = await createClient
        .from('profiles')
        .insert({
          id: user.id,
          name: user.email?.split('@')[0] || user.email || 'User',
          email: user.email || null,
          role: role,
        })
        .select()
        .single()

      if (createError) {
        console.error('Error creating profile:', createError)
        
        // If direct insert fails, try using RPC function
        if (!adminClient) {
          try {
            const { data: functionResult, error: functionError } = await supabase
              .rpc('ensure_profile')

            if (!functionError && functionResult) {
              // Update role if needed
              const adminEmails = [
                'emenjoseph7+conta2@gmail.com',
                'emenmurromua@gmail.com',
                'admin@swipevault.com'
              ]
              if (user.email && adminEmails.includes(user.email.toLowerCase())) {
                console.log('🔑 [Profile Ensure] Atualizando role para admin via RPC')
                await supabase
                  .from('profiles')
                  .update({ role: 'admin' })
                  .eq('id', user.id)
              }
              
              return NextResponse.json({
                success: true,
                profile: functionResult,
                action: 'created_via_function'
              })
            }
          } catch (rpcError) {
            console.error('RPC function also failed:', rpcError)
          }
        }
        
        return NextResponse.json(
          { error: 'Failed to create profile', details: createError },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        profile: newProfile,
        action: 'created'
      })
    }
  } catch (error: any) {
    console.error('Error in ensure profile:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  } finally {
    ensureInProgress = false
  }
}

