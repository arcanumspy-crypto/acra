import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createTicket, getUserTickets } from "@/lib/db/tickets"

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

    const tickets = await getUserTickets(user.id)

    return NextResponse.json({ tickets })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao buscar tickets" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { subject, message } = body

    if (!subject || !message) {
      return NextResponse.json(
        { error: "Campos obrigatórios: subject, message" },
        { status: 400 }
      )
    }

    const ticket = await createTicket(user.id, subject, message)

    return NextResponse.json({ ticket }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao criar ticket" },
      { status: 500 }
    )
  }
}

