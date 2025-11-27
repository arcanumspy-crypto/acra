import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export async function GET(request: Request) {
  try {
    // Try to get user from cookies first
    const supabase = await createClient()
    let { data: { user }, error: authError } = await supabase.auth.getUser()
    
    // If that fails, try from Authorization header
    if (authError || !user) {
      const authHeader = request.headers.get('Authorization')
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7)
        // Create a new client with the token
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
        { error: "Não autenticado" },
        { status: 401 }
      )
    }

    // Check if user is admin using admin client to bypass RLS
    const adminClient = createAdminClient()
    const { data: profile } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 403 }
      )
    }

    // OTIMIZAÇÃO: Buscar ofertas sem join com niches primeiro (mais rápido)
    // Se precisar de nichos, pode fazer join depois ou buscar separadamente
    const startTime = Date.now()
    console.log('⏱️ [API /admin/offers] Iniciando busca de ofertas...')
    
    let offers: any[] = []
    let error: any = null
    
    // Buscar ofertas com categoria (sem niche para ser mais rápido)
    const queryStartTime = Date.now()
    const { data: offersData, error: offersError } = await adminClient
      .from('offers')
      .select(`
        *,
        category:categories(id, name, slug, emoji)
      `)
      .order('created_at', { ascending: false })
      .limit(1000) // Limitar a 1000 ofertas para não sobrecarregar
      
    // Se houver erro relacionado a campos que não existem, tentar sem eles
    if (offersError && (offersError.code === '42703' || offersError.message?.includes('column') || offersError.message?.includes('does not exist'))) {
      console.warn('⚠️ [API /admin/offers] Alguns campos podem não existir, tentando query básica...')
      const { data: basicOffers, error: basicError } = await adminClient
        .from('offers')
        .select(`
          id,
          title,
          short_description,
          category_id,
          niche_id,
          country,
          funnel_type,
          temperature,
          main_url,
          facebook_ads_url,
          vsl_url,
          drive_copy_url,
          drive_creatives_url,
          quiz_url,
          is_active,
          created_at,
          updated_at,
          category:categories(id, name, slug, emoji)
        `)
        .order('created_at', { ascending: false })
        .limit(1000)
      
      if (!basicError) {
        offers = basicOffers || []
      } else {
        throw basicError
      }
    } else if (offersError) {
      throw offersError
    } else {
      offers = offersData || []
    }
    
    const queryTime = Date.now() - queryStartTime
    console.log(`⏱️ [API /admin/offers] Query executada em ${queryTime}ms`, {
      offersCount: offersData?.length || 0
    })

    if (offersError) {
      console.error('❌ [API /admin/offers] Erro ao buscar ofertas:', offersError)
      error = offersError
    } else {
      offers = offersData || []
      
      // Se houver muitas ofertas, tentar buscar nichos em batch (opcional, pode ser feito depois)
      // Por enquanto, retornar sem nichos para ser mais rápido
    }

    if (error) throw error

    const totalTime = Date.now() - startTime
    console.log(`✅ [API /admin/offers] Ofertas carregadas em ${totalTime}ms`, {
      count: offers.length
    })

    return NextResponse.json({ offers: offers || [] })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao buscar ofertas" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  console.log('🔵 POST /api/admin/offers - Iniciando...')
  try {
    // Try to get user from cookies first
    const supabase = await createClient()
    let { data: { user }, error: authError } = await supabase.auth.getUser()
    console.log('🔵 Usuário obtido:', user?.id || 'não encontrado')
    
    // If that fails, try from Authorization header
    if (authError || !user) {
      const authHeader = request.headers.get('Authorization')
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7)
        // Create a new client with the token
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
        { error: "Não autenticado" },
        { status: 401 }
      )
    }

    // Check if user is admin using adminClient to bypass RLS
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

    const { data: profile } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 403 }
      )
    }

    const body = await request.json()
    console.log('🔵 Body recebido:', body)
    const {
      title,
      short_description,
      category_id,
      niche_id,
      country,
      funnel_type,
      temperature,
      main_url,
      facebook_ads_url,
      vsl_url,
      drive_copy_url,
      drive_creatives_url,
      quiz_url,
      is_active,
      headline,
      subheadline,
      hook,
      big_idea,
      bullets,
      cta_text,
      analysis,
    } = body

    if (!title || !category_id || !funnel_type || !main_url || !country) {
      return NextResponse.json(
        { error: "Campos obrigatórios: title, category_id, funnel_type, main_url, country" },
        { status: 400 }
      )
    }

    // Verificar se a categoria existe antes de inserir
    const { data: category, error: categoryError } = await adminClient
      .from('categories')
      .select('id')
      .eq('id', category_id)
      .single()

    if (categoryError || !category) {
      console.error('Erro ao verificar categoria:', categoryError)
      return NextResponse.json(
        { error: "Categoria não encontrada" },
        { status: 400 }
      )
    }

    // Verificar se niche_id é válido (se fornecido)
    let finalNicheId = null
    if (niche_id && niche_id !== 'none') {
      try {
        const { data: niche, error: nicheError } = await adminClient
          .from('niches')
          .select('id')
          .eq('id', niche_id)
          .maybeSingle()

        // Se a tabela niches não existir, apenas ignorar o niche_id
        if (nicheError && (nicheError.message?.includes('schema cache') || 
            nicheError.message?.includes('not found') || 
            nicheError.code === 'PGRST202' || 
            nicheError.code === '42P01')) {
          console.warn('Tabela niches não encontrada, criando oferta sem nicho')
          finalNicheId = null
        } else if (nicheError) {
          console.error('Erro ao verificar nicho:', nicheError)
          return NextResponse.json(
            { error: "Erro ao verificar nicho" },
            { status: 400 }
          )
        } else if (!niche) {
          return NextResponse.json(
            { error: "Nicho não encontrado" },
            { status: 400 }
          )
        } else {
          finalNicheId = niche_id
        }
      } catch (nicheCheckError: any) {
        // Se houver qualquer erro ao verificar nicho, apenas ignorar e criar sem nicho
        console.warn('Erro ao verificar nicho, criando oferta sem nicho:', nicheCheckError.message)
        finalNicheId = null
      }
    }

    const insertData: any = {
      title,
      short_description: short_description || null,
      category_id,
      niche_id: finalNicheId,
      country: country || 'BR',
      funnel_type,
      temperature: temperature || 'testing',
      main_url,
      facebook_ads_url: facebook_ads_url || null,
      vsl_url: vsl_url || null,
      drive_copy_url: drive_copy_url || null,
      drive_creatives_url: drive_creatives_url || null,
      quiz_url: quiz_url || null,
      is_active: is_active !== undefined ? is_active : true,
      created_by: user.id,
      scaled_at: body.scaled_at || null,
      expires_at: body.expires_at || null,
    }

    // Adicionar campos da estrutura da oferta apenas se fornecidos
    // Não adicionar se forem undefined para evitar erros de colunas inexistentes
    if (headline !== undefined && headline !== null) insertData.headline = headline
    if (subheadline !== undefined && subheadline !== null) insertData.subheadline = subheadline
    if (hook !== undefined && hook !== null) insertData.hook = hook
    if (big_idea !== undefined && big_idea !== null) insertData.big_idea = big_idea
    if (bullets !== undefined && bullets !== null) insertData.bullets = bullets
    if (cta_text !== undefined && cta_text !== null) insertData.cta_text = cta_text
    // Remover analysis e creator_notes se não existirem na tabela
    // A migration 024 precisa ser executada para adicionar esses campos
    
    console.log('🔵 Inserindo oferta com dados:', insertData)
    
    const { data: offerInsert, error: insertError } = await adminClient
      .from('offers')
      .insert(insertData)
      .select('*')
      .single()

    if (insertError) {
      console.error('❌ Erro ao inserir oferta:', insertError)
      console.error('Detalhes do erro:', {
        code: insertError.code,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint
      })
      
      // Se o erro for relacionado a coluna não encontrada (PGRST204), tentar sem campos opcionais
      if (insertError.code === 'PGRST204' || insertError.message?.includes('schema cache') || insertError.message?.includes('column')) {
        console.warn('⚠️ Coluna não encontrada, tentando inserir sem campos opcionais de estrutura')
        
        // Remover campos de estrutura que podem não existir
        const safeInsertData: any = {
          title,
          short_description: short_description || null,
          category_id,
          niche_id: finalNicheId,
          country: country || 'BR',
          funnel_type,
          temperature: temperature || 'testing',
          main_url,
          facebook_ads_url: facebook_ads_url || null,
          vsl_url: vsl_url || null,
          drive_copy_url: drive_copy_url || null,
          drive_creatives_url: drive_creatives_url || null,
          quiz_url: quiz_url || null,
          is_active: is_active !== undefined ? is_active : true,
          created_by: user.id,
        }
        
        // Tentar inserir novamente sem os campos opcionais
        const { data: retryOffer, error: retryError } = await adminClient
          .from('offers')
          .insert(safeInsertData)
          .select('*')
          .single()
        
        if (retryError) {
          return NextResponse.json(
            { 
              error: retryError.message || "Erro ao criar oferta",
              details: retryError.details || null,
              code: retryError.code || null,
              hint: "Execute a migration 024_add_offer_structure_fields.sql para adicionar campos de estrutura"
            },
            { status: 500 }
          )
        }
        
        // Se funcionou, retornar a oferta criada
        return NextResponse.json({ offer: retryOffer }, { status: 201 })
      }
      
      // Se o erro for relacionado a foreign key ou constraint
      if (insertError.code === '23503') {
        return NextResponse.json(
          { 
            error: "Erro de referência: Verifique se a categoria e/ou nicho existem",
            details: insertError.message
          },
          { status: 400 }
        )
      }
      
      return NextResponse.json(
        { 
          error: insertError.message || "Erro ao criar oferta",
          details: insertError.details || null,
          code: insertError.code || null
        },
        { status: 500 }
      )
    }

    // Tentar buscar com relacionamentos, se falhar retornar sem
    let offer = offerInsert
    try {
      const { data: offerWithRelations, error: relationError } = await adminClient
        .from('offers')
        .select(`
          *,
          category:categories(id, name, slug, emoji),
          niche:niches(id, name, slug)
        `)
        .eq('id', offerInsert.id)
        .single()

      // Verificar se o erro é relacionado ao relacionamento com niches
      const isNicheError = relationError && (
        relationError.message?.includes('niches') ||
        relationError.message?.includes('relationship') ||
        relationError.message?.includes('schema cache') ||
        relationError.code === 'PGRST116' ||
        relationError.code === '42P01' ||
        relationError.code === 'PGRST202'
      )

      if (!isNicheError && !relationError && offerWithRelations) {
        offer = offerWithRelations
      } else if (isNicheError) {
        // Se o erro for de relacionamento com niches, buscar sem o relacionamento
        console.warn('⚠️ Erro ao buscar relacionamento com niches, buscando sem ele')
        const { data: offerWithCategory, error: categoryError } = await adminClient
          .from('offers')
          .select(`
            *,
            category:categories(id, name, slug, emoji)
          `)
          .eq('id', offerInsert.id)
          .single()
        
        if (!categoryError && offerWithCategory) {
          offer = offerWithCategory
        }
      }
    } catch (e: any) {
      // Ignorar erro de relacionamento e usar oferta sem relacionamentos
      console.warn('⚠️ Erro ao buscar relacionamentos, retornando oferta sem eles:', e.message)
    }

    console.log('✅ Oferta criada com sucesso:', offer?.id)
    return NextResponse.json({ offer }, { status: 201 })
  } catch (error: any) {
    console.error('❌ Erro geral ao criar oferta:', error)
    console.error('Stack trace:', error.stack)
    return NextResponse.json(
      { 
        error: error.message || "Erro ao criar oferta",
        details: error.details || null,
        code: error.code || null
      },
      { status: 500 }
    )
  }
}

