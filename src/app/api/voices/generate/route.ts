/**
 * Endpoint de Geração de Áudio
 * Gera áudio usando modelo criado na Fish API
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getModelForUser } from "@/lib/db-voice"
import { saveToStorage } from "@/lib/storage"

const FISH_AUDIO_API_KEY = process.env.FISH_AUDIO_API_KEY
const FISH_AUDIO_API_URL = process.env.FISH_AUDIO_API_URL || "https://api.fish.audio"

export async function POST(request: NextRequest) {
  console.log('🚀 POST /api/voices/generate - Iniciando...')
  
  try {
    const supabase = await createClient()
    
    // Autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado", details: authError?.message },
        { status: 401 }
      )
    }
    
    const body = await request.json()
    const { userId, modelId, voiceCloneId, text, params } = body
    
    if (!text) {
      return NextResponse.json(
        { error: "Texto é obrigatório" },
        { status: 400 }
      )
    }
    
    // Resolver modelId
    let model = modelId
    
    if (!model && voiceCloneId) {
      // Buscar pelo voiceCloneId
      const voiceModel = await getModelForUser(user.id, voiceCloneId)
      if (voiceModel) {
        model = voiceModel.model_id
      }
    }
    
    if (!model) {
      // Buscar modelo padrão do usuário
      const voiceModel = await getModelForUser(user.id)
      if (!voiceModel) {
        return NextResponse.json(
          { error: "Nenhum modelo encontrado para o usuário" },
          { status: 400 }
        )
      }
      model = voiceModel.model_id
    }
    
    console.log('🎯 Gerando áudio:', {
      model,
      textLength: text.length,
      params
    })
    
    // Preparar payload para Fish API
    const payload: any = {
      model: model,
      text: text,
      format: params?.format || "mp3",
      speed: params?.speed ?? 1.0,
      volume: params?.volume ?? 0,
      temperature: params?.temperature ?? 0.9,
      top_p: params?.top_p ?? 0.9
    }
    
    // Adicionar parâmetros opcionais
    if (params?.pitch) payload.pitch = params.pitch
    if (params?.emotion) payload.emotion = params.emotion
    if (params?.language) payload.language = params.language
    
    console.log('📤 Enviando para Fish API /v1/tts...')
    
    const response = await fetch(`${FISH_AUDIO_API_URL}/v1/tts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${FISH_AUDIO_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Erro na Fish API:', errorText)
      return NextResponse.json(
        { error: "Erro ao gerar áudio", details: errorText },
        { status: response.status }
      )
    }
    
    // Obter áudio gerado
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    console.log('✅ Áudio gerado:', buffer.length, 'bytes')
    
    // Salvar no storage (opcional)
    let audioUrl: string | null = null
    
    if (params?.saveToStorage !== false) {
      try {
        const fileName = `voice-generations/${user.id}/${Date.now()}.${params?.format || 'mp3'}`
        audioUrl = await saveToStorage(buffer, fileName)
        console.log('✅ Áudio salvo no storage:', audioUrl)
      } catch (storageError: any) {
        console.warning('⚠️ Erro ao salvar no storage:', storageError.message)
        // Continuar mesmo se falhar
      }
    }
    
    // Retornar base64 ou URL
    const audioBase64 = buffer.toString('base64')
    
    return NextResponse.json({
      success: true,
      audio_base64: audioBase64,
      audio_url: audioUrl,
      format: params?.format || 'mp3',
      size: buffer.length
    })
    
  } catch (error: any) {
    console.error('❌ Erro ao gerar áudio:', error)
    return NextResponse.json(
      { error: error.message || "Erro ao gerar áudio" },
      { status: 500 }
    )
  }
}

