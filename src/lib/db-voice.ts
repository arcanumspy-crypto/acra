/**
 * Helpers de Banco de Dados para Vozes
 * Implementa métodos para salvar/buscar modelos de voz
 */

import { createAdminClient } from "@/lib/supabase/admin"

export interface VoiceModel {
  id: string
  user_id: string
  name: string
  model_id: string // ID do modelo na Fish API ou local
  status: 'processing' | 'ready' | 'failed'
  audio_urls?: string[]
  embedding_path?: string
  metadata?: any
  created_at: string
  updated_at: string
}

/**
 * Salva modelo de voz no banco
 */
export async function saveModelToDB(data: {
  userId: string
  name: string
  model_id: string
  audio_urls?: string[]
  embedding_path?: string
  metadata?: any
}): Promise<VoiceModel> {
  const adminClient = createAdminClient()
  
  const { data: voiceClone, error } = await adminClient
    .from('voice_clones')
    .insert({
      user_id: data.userId,
      name: data.name,
      voice_id: data.model_id, // Usar model_id como voice_id
      audio_url: data.audio_urls?.[0] || null,
      audio_urls: data.audio_urls || null,
      status: 'ready',
      description: data.metadata?.description || null,
    })
    .select()
    .single()
  
  if (error) {
    throw new Error(`Erro ao salvar modelo: ${error.message}`)
  }
  
  return {
    id: voiceClone.id,
    user_id: voiceClone.user_id,
    name: voiceClone.name,
    model_id: voiceClone.voice_id,
    status: voiceClone.status as 'processing' | 'ready' | 'failed',
    audio_urls: voiceClone.audio_urls || (voiceClone.audio_url ? [voiceClone.audio_url] : []),
    created_at: voiceClone.created_at,
    updated_at: voiceClone.updated_at,
  }
}

/**
 * Busca modelo de voz do usuário
 */
export async function getModelForUser(
  userId: string,
  modelId?: string
): Promise<VoiceModel | null> {
  const adminClient = createAdminClient()
  
  let query = adminClient
    .from('voice_clones')
    .select('*')
    .eq('user_id', userId)
  
  if (modelId) {
    query = query.eq('id', modelId).or(`voice_id.eq.${modelId}`)
  }
  
  query = query.order('created_at', { ascending: false }).limit(1)
  
  const { data: voiceClone, error } = await query.single()
  
  if (error || !voiceClone) {
    return null
  }
  
  return {
    id: voiceClone.id,
    user_id: voiceClone.user_id,
    name: voiceClone.name,
    model_id: voiceClone.voice_id,
    status: voiceClone.status as 'processing' | 'ready' | 'failed',
    audio_urls: voiceClone.audio_urls || (voiceClone.audio_url ? [voiceClone.audio_url] : []),
    created_at: voiceClone.created_at,
    updated_at: voiceClone.updated_at,
  }
}

/**
 * Atualiza status do modelo
 */
export async function updateModelStatus(
  modelId: string,
  status: 'processing' | 'ready' | 'failed',
  metadata?: any
): Promise<void> {
  const adminClient = createAdminClient()
  
  const updateData: any = { status }
  if (metadata) {
    updateData.description = JSON.stringify(metadata)
  }
  
  const { error } = await adminClient
    .from('voice_clones')
    .update(updateData)
    .eq('id', modelId)
  
  if (error) {
    throw new Error(`Erro ao atualizar modelo: ${error.message}`)
  }
}

