-- ============================================
-- ENSURE OFFERS TABLE HAS ALL REQUIRED COLUMNS
-- Migration 018: Garantir que a tabela offers tem todas as colunas necessárias
-- ============================================

-- Adicionar colunas se não existirem (sem foreign key primeiro)
ALTER TABLE offers 
ADD COLUMN IF NOT EXISTS niche_id UUID,
ADD COLUMN IF NOT EXISTS facebook_ads_url TEXT,
ADD COLUMN IF NOT EXISTS vsl_url TEXT,
ADD COLUMN IF NOT EXISTS drive_copy_url TEXT,
ADD COLUMN IF NOT EXISTS drive_creatives_url TEXT,
ADD COLUMN IF NOT EXISTS quiz_url TEXT;

-- Criar índice para niche_id se não existir
CREATE INDEX IF NOT EXISTS idx_offers_niche_id ON offers(niche_id);

-- Adicionar foreign key constraint apenas se a tabela niches existir
DO $$
BEGIN
  -- Verificar se a tabela niches existe
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'niches') THEN
    -- Remover constraint existente se houver
    ALTER TABLE offers DROP CONSTRAINT IF EXISTS offers_niche_id_fkey;
    
    -- Adicionar foreign key constraint
    ALTER TABLE offers 
    ADD CONSTRAINT offers_niche_id_fkey 
    FOREIGN KEY (niche_id) REFERENCES niches(id) ON DELETE SET NULL;
    
    RAISE NOTICE 'Foreign key constraint adicionada para niche_id';
  ELSE
    RAISE NOTICE 'Tabela niches não encontrada. Foreign key não adicionada. Execute a migração 017 primeiro.';
  END IF;
END $$;

