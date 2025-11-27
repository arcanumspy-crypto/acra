import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getActiveCommunitiesForUser, joinCommunity } from "@/lib/db/communities"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      )
    }

    const communities = await getActiveCommunitiesForUser()

    return NextResponse.json({ communities })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao buscar comunidades" },
      { status: 500 }
    )
  }
}

