-- ============================================
-- ADD METADATA COLUMN TO VOICE_CLONES
-- ============================================

-- Adicionar coluna metadata (JSONB) para armazenar informações adicionais
ALTER TABLE voice_clones
ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Comentário explicativo
COMMENT ON COLUMN voice_clones.metadata IS 'JSONB com informações adicionais sobre a voz (método de clonagem, contagem de áudios, etc)';

