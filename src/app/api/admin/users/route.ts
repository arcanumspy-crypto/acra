import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getAllUsers } from "@/lib/db/admin/users"

export async function GET(request: Request) {
  try {
    const startTime = Date.now()
    console.log('⏱️ [API Admin Users] Iniciando busca de todos os usuários...')
    
    // Usar a função getAllUsers que já tem tratamento de erro e busca todos os usuários
    const users = await getAllUsers()
    
    const totalTime = Date.now() - startTime
    console.log(`✅ [API Admin Users] ${users.length} usuários retornados em ${totalTime}ms`)

    // Mapear para o formato esperado pela página
    const mappedUsers = users.map(user => ({
      id: user.id,
      name: user.name,
      phone_number: user.phone_number || null,
      email: user.email || null,
      role: user.role,
      created_at: user.created_at,
      subscription: user.subscriptions?.[0] || null,
    }))

    return NextResponse.json({ users: mappedUsers })
  } catch (error: any) {
    console.error('❌ [API Admin Users] Erro ao buscar usuários:', error)
    return NextResponse.json(
      { error: error.message || "Erro ao processar requisição" },
      { status: 500 }
    )
  }
}

