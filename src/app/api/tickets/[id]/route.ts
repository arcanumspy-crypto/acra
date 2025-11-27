import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getTicketWithReplies, userReplyToTicket } from "@/lib/db/tickets"

export async function GET(
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

    const ticket = await getTicketWithReplies(params.id, user.id)

    if (!ticket) {
      return NextResponse.json(
        { error: "Ticket não encontrado ou sem permissão" },
        { status: 404 }
      )
    }

    return NextResponse.json({ ticket })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao buscar ticket" },
      { status: 500 }
    )
  }
}

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

    const body = await request.json()
    const { message } = body

    if (!message) {
      return NextResponse.json(
        { error: "Campo obrigatório: message" },
        { status: 400 }
      )
    }

    const reply = await userReplyToTicket(params.id, user.id, message)

    return NextResponse.json({ reply }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao responder ticket" },
      { status: 500 }
    )
  }
}

