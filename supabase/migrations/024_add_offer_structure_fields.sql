-- ============================================
-- ADD OFFER STRUCTURE FIELDS
-- Migration 024: Adicionar campos de estrutura da oferta
-- ============================================

-- Adicionar colunas de estrutura da oferta se não existirem
ALTER TABLE offers 
ADD COLUMN IF NOT EXISTS headline TEXT,
ADD COLUMN IF NOT EXISTS subheadline TEXT,
ADD COLUMN IF NOT EXISTS hook TEXT,
ADD COLUMN IF NOT EXISTS big_idea TEXT,
ADD COLUMN IF NOT EXISTS bullets TEXT[], -- Array de strings
ADD COLUMN IF NOT EXISTS cta_text TEXT,
ADD COLUMN IF NOT EXISTS analysis TEXT,
ADD COLUMN IF NOT EXISTS creator_notes TEXT;

-- Comentários
COMMENT ON COLUMN offers.headline IS 'Headline principal da oferta';
COMMENT ON COLUMN offers.subheadline IS 'Subheadline da oferta';
COMMENT ON COLUMN offers.hook IS 'Hook/gancho da oferta';
COMMENT ON COLUMN offers.big_idea IS 'Big Idea - ideia principal';
COMMENT ON COLUMN offers.bullets IS 'Lista de bullets/benefícios';
COMMENT ON COLUMN offers.cta_text IS 'Texto do CTA (Call to Action)';
COMMENT ON COLUMN offers.analysis IS 'Análise: Por que converte?';
COMMENT ON COLUMN offers.creator_notes IS 'Notas do criador sobre a oferta';


