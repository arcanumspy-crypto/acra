import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { slugify } from '@/lib/utils/slugify'

type AdminClient = SupabaseClient<Database>
type OfferRow = Database['public']['Tables']['offers']['Row']
type OfferInsert = Database['public']['Tables']['offers']['Insert']
type OfferUpdate = Database['public']['Tables']['offers']['Update']
type ScalabilityRow = Database['public']['Tables']['offer_scalability_metrics']['Row']

const creativeAssetSchema = z.object({
  url: z.string().url(),
  type: z.enum(['image', 'video', 'other']).default('image')
})

const adSchema = z.object({
  platformId: z.string().min(2),
  adUrl: z.string().url(),
  adText: z.string().optional().nullable(),
  pageName: z.string().optional().nullable(),
  pageProfileUrl: z.string().url().optional().nullable(),
  landingPageUrl: z.string().url().optional().nullable(),
  creativeAssets: z.array(creativeAssetSchema).min(1),
  runStatus: z.string().optional().nullable(),
  country: z.string().optional(),
  impressions: z.string().optional().nullable(),
  frequencyScore: z.number().optional().nullable(),
  firstSeen: z.string().optional().nullable(),
  lastSeen: z.string().optional().nullable(),
  isLikelyScaled: z.boolean().optional(),
  raw: z.record(z.any()).optional()
})

const payloadSchema = z.object({
  category: z.string().min(2),
  niche: z.string().min(2),
  country: z.string().optional(),
  source: z.string().default('facebook'),
  ads: z.array(adSchema).min(1)
})

export async function POST(request: Request) {
  try {
    const secretHeader = request.headers.get('x-scraper-secret')
    if (!secretHeader || secretHeader !== process.env.SCRAPER_API_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => null)
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
    }

    const parsed = payloadSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const supabase = createAdminClient()
    const { category, niche, ads, country: defaultCountry } = parsed.data

    const categoryRecord = await ensureCategory(supabase, category)
    if (!categoryRecord) {
      return NextResponse.json({ error: 'Failed to create/find category' }, { status: 500 })
    }

    const nicheRecord = await ensureNiche(supabase, niche, categoryRecord.id)

    const results = []
    for (const ad of ads) {
      try {
        const result = await syncAd({
          supabase,
          ad,
          categoryId: categoryRecord.id,
          categoryName: categoryRecord.name,
          nicheId: nicheRecord?.id ?? null,
          nicheName: niche,
          defaultCountry
        })
        results.push(result)
      } catch (syncError: any) {
        console.error('Failed to sync ad', ad.platformId, syncError)
        results.push({
          platformId: ad.platformId,
          status: 'error',
          message: syncError?.message || 'Unexpected error'
        })
      }
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      results
    })
  } catch (error: any) {
    console.error('Facebook import failure', error)
    return NextResponse.json({ error: error?.message || 'Internal error' }, { status: 500 })
  }
}

async function syncAd(params: {
  supabase: AdminClient
  ad: z.infer<typeof adSchema>
  categoryId: string
  categoryName: string
  nicheId: string | null
  nicheName: string
  defaultCountry?: string
}) {
  const { supabase, ad, categoryId, nicheId, nicheName, defaultCountry } = params
  const existingOffer = await findExistingOffer(supabase, ad.adUrl, ad.landingPageUrl)
  const existingMetrics = existingOffer ? await getScalabilityMetrics(supabase, existingOffer.id) : null

  const creativeCount = ad.creativeAssets.length
  const baseScaleSignal = Boolean(ad.isLikelyScaled || creativeCount >= 3)
  const projectedRuns = (existingMetrics?.run_count ?? 0) + 1
  const shouldMarkScaled = baseScaleSignal || projectedRuns >= 3

  const title = buildTitle(ad.pageName, nicheName)
  const shortDescription = ad.adText?.slice(0, 260) || `Anúncio coletado automaticamente para o nicho ${nicheName}`
  const mainUrl = ad.landingPageUrl || ad.creativeAssets[0]?.url || ad.adUrl
  const country = ad.country || defaultCountry || 'BR'
  const temperature = shouldMarkScaled ? 'hot' : 'warm'
  const now = new Date().toISOString()

  const basePayload: OfferInsert & OfferUpdate = {
    title,
    short_description: shortDescription,
    category_id: categoryId,
    niche_id: nicheId ?? existingOffer?.niche_id ?? null,
    country,
    funnel_type: existingOffer?.funnel_type || 'other',
    temperature,
    product_type: existingOffer?.product_type || null,
    main_url: mainUrl,
    facebook_ads_url: ad.adUrl,
    landing_page_url: ad.landingPageUrl || null,
    page_name: ad.pageName || null,
    ad_text: ad.adText || null,
    creative_asset_urls: sanitizeJson(ad.creativeAssets),
    ad_library_snapshot: sanitizeJson(ad.raw || ad),
    drive_copy_url: existingOffer?.drive_copy_url || null,
    drive_creatives_url: existingOffer?.drive_creatives_url || null,
    quiz_url: existingOffer?.quiz_url || null,
    vsl_url: existingOffer?.vsl_url || null,
    is_active: true
  }

  let offerId: string
  let action: 'created' | 'updated' = 'updated'

  if (existingOffer) {
    const updates: OfferUpdate = {
      ...basePayload,
      updated_at: now
    }
    if (shouldMarkScaled && !existingOffer.scaled_at) {
      updates.scaled_at = now
    }
    const { error } = await supabase
      .from('offers')
      .update(stripUndefined(updates))
      .eq('id', existingOffer.id)

    if (error) throw error
    offerId = existingOffer.id
  } else {
    const insertPayload: OfferInsert = {
      ...basePayload,
      created_at: now,
      updated_at: now,
      scaled_at: shouldMarkScaled ? now : null
    }
    const { data, error } = await supabase
      .from('offers')
      .insert(stripUndefined(insertPayload))
      .select('id')
      .single()

    if (error) throw error
    offerId = data.id
    action = 'created'
  }

  await syncScalabilityMetrics({
    supabase,
    offerId,
    ad,
    shouldMarkScaled,
    existingMetrics,
    projectedRuns
  })

  return {
    platformId: ad.platformId,
    offerId,
    action,
    isScaled: shouldMarkScaled
  }
}

async function ensureCategory(client: AdminClient, name: string) {
  const payload = {
    name: name.trim(),
    slug: slugify(name),
    is_premium: false
  }

  const { data, error } = await client
    .from('categories')
    .upsert(payload, { onConflict: 'slug' })
    .select('id, name, slug')
    .single()

  if (error) throw error
  return data
}

async function ensureNiche(client: AdminClient, name: string, categoryId: string) {
  try {
    const payload = {
      name: name.trim(),
      slug: slugify(`${categoryId}-${name}`),
      category_id: categoryId,
      is_active: true
    }

    const { data, error } = await client
      .from('niches')
      .upsert(payload, { onConflict: 'slug' })
      .select('id, name, slug')
      .single()

    if (error) throw error
    return data
  } catch (error: any) {
    // Table might not exist in some deployments – continue without blocking
    if (error?.code === '42P01') {
      console.warn('Tabela niches não encontrada, continuando sem nicho...')
      return null
    }
    throw error
  }
}

async function findExistingOffer(client: AdminClient, facebookUrl?: string | null, landingPage?: string | null) {
  if (!facebookUrl && !landingPage) return null

  if (facebookUrl) {
    const { data, error } = await client
      .from('offers')
      .select('*')
      .eq('facebook_ads_url', facebookUrl)
      .maybeSingle()
    if (data) return data as OfferRow
    if (error && error.code !== 'PGRST116') throw error
  }

  if (landingPage) {
    const { data, error } = await client
      .from('offers')
      .select('*')
      .eq('landing_page_url', landingPage)
      .maybeSingle()
    if (data) return data as OfferRow
    if (error && error.code !== 'PGRST116') throw error
  }

  return null
}

async function getScalabilityMetrics(client: AdminClient, offerId: string) {
  try {
    const { data, error } = await client
      .from('offer_scalability_metrics')
      .select('*')
      .eq('offer_id', offerId)
      .maybeSingle()

    if (error && error.code !== 'PGRST116') throw error
    return data as ScalabilityRow | null
  } catch (error: any) {
    if (error?.code === '42P01') {
      console.warn('Tabela offer_scalability_metrics não existe ainda.')
      return null
    }
    throw error
  }
}

async function syncScalabilityMetrics(params: {
  supabase: AdminClient
  offerId: string
  ad: z.infer<typeof adSchema>
  shouldMarkScaled: boolean
  existingMetrics: ScalabilityRow | null
  projectedRuns: number
}) {
  const { supabase, offerId, ad, shouldMarkScaled, existingMetrics, projectedRuns } = params
  const now = new Date().toISOString()
  const metadata = {
    ...(existingMetrics?.metadata as Record<string, any> || {}),
    platform_id: ad.platformId,
    run_status: ad.runStatus || null,
    page_profile_url: ad.pageProfileUrl || null,
    source: 'facebook',
    creative_types: ad.creativeAssets.map(asset => asset.type)
  }

  const payload = {
    offer_id: offerId,
    creative_count: ad.creativeAssets.length,
    impressions_range: ad.impressions || null,
    frequency_score: ad.frequencyScore ?? null,
    is_high_scale: shouldMarkScaled,
    first_seen: existingMetrics?.first_seen || ad.firstSeen || now,
    last_seen: ad.lastSeen || now,
    run_count: projectedRuns,
    metadata
  }

  try {
    if (existingMetrics) {
      const { error } = await supabase
        .from('offer_scalability_metrics')
        .update({
          ...payload,
          updated_at: now
        })
        .eq('offer_id', offerId)
      if (error) throw error
    } else {
      const { error } = await supabase
        .from('offer_scalability_metrics')
        .insert({
          ...payload,
          created_at: now,
          updated_at: now
        })
      if (error) throw error
    }
  } catch (error: any) {
    if (error?.code === '42P01') {
      console.warn('offer_scalability_metrics table missing, skipping metrics sync.')
      return
    }
    throw error
  }
}

function buildTitle(pageName?: string | null, nicheName?: string) {
  if (pageName) return `${pageName} - ${capitalize(nicheName || '')}`.trim()
  return `Anúncio ${capitalize(nicheName || '')}`.trim()
}

function capitalize(value: string) {
  if (!value) return ''
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function sanitizeJson(value: unknown) {
  try {
    return JSON.parse(JSON.stringify(value))
  } catch {
    return null
  }
}

function stripUndefined<T extends Record<string, any>>(obj: T) {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== undefined)
  ) as T
}


