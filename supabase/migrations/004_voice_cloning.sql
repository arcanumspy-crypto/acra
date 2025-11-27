-- ============================================
-- VOICE CLONING TABLES
-- ============================================

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. VOICE_CLONES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS voice_clones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  voice_id TEXT NOT NULL, -- ID gerado localmente para identificação
  audio_url TEXT, -- URL do áudio no Supabase Storage
  description TEXT,
  status TEXT NOT NULL DEFAULT 'ready', -- 'processing', 'ready', 'failed'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 2. VOICE_AUDIO_GENERATIONS TABLE (Cache)
-- ============================================
CREATE TABLE IF NOT EXISTS voice_audio_generations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  voice_clone_id UUID NOT NULL REFERENCES voice_clones(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  text_hash TEXT NOT NULL, -- Hash do texto para cache
  audio_url TEXT NOT NULL, -- URL do áudio gerado no Supabase Storage
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(voice_clone_id, text_hash) -- Evitar gerações duplicadas
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_voice_clones_user_id ON voice_clones(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_clones_created_at ON voice_clones(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_voice_audio_generations_user_id ON voice_audio_generations(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_audio_generations_voice_clone_id ON voice_audio_generations(voice_clone_id);
CREATE INDEX IF NOT EXISTS idx_voice_audio_generations_text_hash ON voice_audio_generations(text_hash);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE voice_clones ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_audio_generations ENABLE ROW LEVEL SECURITY;

-- Users can view their own voice clones
DROP POLICY IF EXISTS "Users can view own voice clones" ON voice_clones;
CREATE POLICY "Users can view own voice clones"
  ON voice_clones FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own voice clones
DROP POLICY IF EXISTS "Users can insert own voice clones" ON voice_clones;
CREATE POLICY "Users can insert own voice clones"
  ON voice_clones FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own voice clones
DROP POLICY IF EXISTS "Users can update own voice clones" ON voice_clones;
CREATE POLICY "Users can update own voice clones"
  ON voice_clones FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own voice clones
DROP POLICY IF EXISTS "Users can delete own voice clones" ON voice_clones;
CREATE POLICY "Users can delete own voice clones"
  ON voice_clones FOR DELETE
  USING (auth.uid() = user_id);

-- Users can view their own audio generations
DROP POLICY IF EXISTS "Users can view own audio generations" ON voice_audio_generations;
CREATE POLICY "Users can view own audio generations"
  ON voice_audio_generations FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own audio generations
DROP POLICY IF EXISTS "Users can insert own audio generations" ON voice_audio_generations;
CREATE POLICY "Users can insert own audio generations"
  ON voice_audio_generations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own audio generations
DROP POLICY IF EXISTS "Users can delete own audio generations" ON voice_audio_generations;
CREATE POLICY "Users can delete own audio generations"
  ON voice_audio_generations FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- TRIGGER FOR UPDATED_AT
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_voice_clones_updated_at ON voice_clones;
CREATE TRIGGER update_voice_clones_updated_at BEFORE UPDATE
ON voice_clones FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

