import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getNewOffers } from "@/lib/db/offers-server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Try to get user from cookies first
    let { data: { user }, error: authError } = await supabase.auth.getUser()
    
    // If that fails, try from Authorization header
    if (authError || !user) {
      const authHeader = request.headers.get('Authorization')
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7)
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
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
          authError = null
        }
      }
    }

    if (authError || !user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10', 10)
    const days = parseInt(searchParams.get('days') || '7', 10)

    const offers = await getNewOffers(limit, days)

    return NextResponse.json({
      success: true,
      offers
    })
  } catch (error: any) {
    console.error('Error in /api/dashboard/new-offers:', error)
    return NextResponse.json(
      { error: error.message || "Erro ao buscar ofertas novas" },
      { status: 500 }
    )
  }
}



