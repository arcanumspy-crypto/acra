-- ============================================
-- ADD MULTIPLE AUDIO SUPPORT TO VOICE_CLONES
-- ============================================

-- Adicionar coluna para armazenar múltiplos áudios (JSON array)
ALTER TABLE voice_clones
ADD COLUMN IF NOT EXISTS audio_urls JSONB;

-- Comentário explicativo
COMMENT ON COLUMN voice_clones.audio_urls IS 'Array JSON com todas as URLs dos áudios de referência (múltiplos áudios para melhor treinamento)';

