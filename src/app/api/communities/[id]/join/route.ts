import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { joinCommunity } from "@/lib/db/communities"

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      )
    }

    await joinCommunity(user.id, params.id)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao entrar na comunidade" },
      { status: 500 }
    )
  }
}

