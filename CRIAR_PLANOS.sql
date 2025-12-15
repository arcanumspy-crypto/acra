-- ============================================
-- CRIAR PLANOS NO SUPABASE
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- Inserir planos Mensal, Trimestral e Anual (os que o sistema usa)
INSERT INTO "public"."plans" 
  ("name", "slug", "description", "price_monthly_cents", "is_active", "created_at") 
VALUES 
  ('Mensal', 'mensal', 'Plano mensal - 800 MT', 80000, true, NOW()),
  ('Trimestral', 'trimestral', 'Plano trimestral - 2160 MT (10% desconto)', 72000, true, NOW()),
  ('Anual', 'anual', 'Plano anual - 7680 MT (20% desconto)', 64000, true, NOW())
ON CONFLICT (slug) DO UPDATE
SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_monthly_cents = EXCLUDED.price_monthly_cents,
  is_active = EXCLUDED.is_active;

-- Verificar se os planos foram criados
SELECT 
  id,
  name,
  slug,
  description,
  price_monthly_cents,
  is_active,
  created_at
FROM "public"."plans"
WHERE slug IN ('mensal', 'trimestral', 'anual')
ORDER BY price_monthly_cents;

