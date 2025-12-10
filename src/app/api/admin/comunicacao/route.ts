import { NextResponse, NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email/resend'
import { getAdminNewsletterEmail, getAdminPaymentOverdueEmail } from '@/lib/email/admin-templates'
import { ensureArray } from '@/lib/supabase-utils'
import type { ProfileBasic, UserBasic } from '@/types/schemas'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    let { data: { user }, error: authError } = await supabase.auth.getUser()
    
    // Se não encontrou usuário via cookies, tentar via Authorization header
    if (authError || !user) {
      const authHeader = request.headers.get('Authorization')
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7)
        const { data: { user: userFromToken } } = await supabase.auth.getUser(token)
        user = userFromToken
      }
    }

    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      )
    }

    // Verificar se é admin usando adminClient para bypass RLS
    let adminClient
    try {
      adminClient = createAdminClient()
    } catch (adminError: any) {
      console.error('Erro ao criar admin client:', adminError)
      return NextResponse.json(
        { error: adminError.message || "Erro de configuração do servidor" },
        { status: 500 }
      )
    }

    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Erro ao buscar perfil:', profileError)
      return NextResponse.json(
        { error: "Erro ao verificar permissões" },
        { status: 500 }
      )
    }

    const profileRole = profile ? (profile as unknown as { role?: string }).role : null
    if (profileRole !== 'admin') {
      return NextResponse.json(
        { error: "Não autorizado. Apenas administradores podem acessar este endpoint." },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { 
      emailType, 
      userIds, 
      subject, 
      message, 
      ctaText, 
      ctaUrl,
      // Para pagamentos atrasados
      amount,
      currency,
      dueDate,
      invoiceNumber,
      paymentUrl
    } = body

    if (!emailType || !userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: "emailType e userIds são obrigatórios" },
        { status: 400 }
      )
    }

    // Buscar perfis (sem email, pois email está em auth.users)
    const { data: profilesRaw, error: profilesError } = await adminClient
      .from('profiles')
      .select('id, name')
      .in('id', userIds)

    // Tratar erro do Supabase
    if (profilesError) {
      console.error('Supabase profiles error', profilesError)
      return NextResponse.json(
        { error: "Erro ao buscar usuários: " + profilesError.message },
        { status: 500 }
      )
    }

    // Garantir array e tipar
    const profiles = ensureArray<ProfileBasic>(profilesRaw)

    if (profiles.length === 0) {
      return NextResponse.json(
        { error: "Nenhum usuário encontrado" },
        { status: 400 }
      )
    }

    // Buscar emails de auth.users para cada perfil
    const users: UserBasic[] = await Promise.all(
      profiles.map(async (profile) => {
        try {
          const { data: authUser } = await adminClient.auth.admin.getUserById(profile.id)
          return {
            id: profile.id,
            name: profile.name || null,
            email: authUser?.user?.email || null,
          } as UserBasic
        } catch (error) {
          console.warn(`Erro ao buscar email para usuário ${profile.id}:`, error)
          return {
            id: profile.id,
            name: profile.name || null,
            email: null,
          } as UserBasic
        }
      })
    )

    // Filtrar usuários com email válido
    const usersWithValidEmail = users.filter(u => u.email && u.email.trim() !== '')

    if (usersWithValidEmail.length === 0) {
      return NextResponse.json(
        { error: "Nenhum usuário com email válido encontrado" },
        { status: 400 }
      )
    }

    // Enviar emails
    const results = {
      sent: 0,
      failed: 0,
      errors: [] as string[]
    }

    for (const user of usersWithValidEmail) {
      try {
        let html = ''
        let emailSubject = subject || 'ArcanumSpy'

        if (emailType === 'newsletter') {
          if (!message) {
            results.errors.push(`Usuário ${user.name}: mensagem é obrigatória`)
            results.failed++
            continue
          }
          html = getAdminNewsletterEmail({
            name: user.name || 'Usuário',
            subject: emailSubject,
            message,
            ctaText,
            ctaUrl
          })
        } else if (emailType === 'payment_overdue') {
          if (!amount || !dueDate) {
            results.errors.push(`Usuário ${user.name}: amount e dueDate são obrigatórios`)
            results.failed++
            continue
          }
          html = getAdminPaymentOverdueEmail({
            name: user.name || 'Usuário',
            amount,
            currency: currency || 'BRL',
            dueDate,
            invoiceNumber,
            paymentUrl
          })
          emailSubject = '⚠️ Pagamento Atrasado - ArcanumSpy'
        } else {
          results.errors.push(`Tipo de email inválido: ${emailType}`)
          results.failed++
          continue
        }

        const result = await sendEmail({
          to: user.email!,
          subject: emailSubject,
          html,
        })

        if (result.success) {
          results.sent++
        } else {
          results.failed++
          results.errors.push(`Usuário ${user.name}: ${result.error || 'Erro desconhecido'}`)
        }
      } catch (error: any) {
        results.failed++
        results.errors.push(`Usuário ${user.name}: ${error.message || 'Erro ao enviar email'}`)
      }
    }

    return NextResponse.json({
      success: true,
      results: {
        total: usersWithValidEmail.length,
        sent: results.sent,
        failed: results.failed,
        errors: results.errors
      }
    })
  } catch (error: any) {
    console.error('Erro ao enviar emails:', error)
    return NextResponse.json(
      { error: error.message || "Erro ao processar requisição" },
      { status: 500 }
    )
  }
}

