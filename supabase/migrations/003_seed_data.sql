-- ============================================
-- SEED PLANS
-- ============================================
INSERT INTO plans (name, slug, description, price_monthly_cents, max_offers_visible, max_favorites) VALUES
  ('Founder', 'founder', 'Para quem está começando a escalar', 14700, 200, NULL),
  ('Elite', 'elite', 'Acesso completo e ilimitado', 19700, NULL, NULL)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- SEED CATEGORIES
-- ============================================
INSERT INTO categories (name, slug, emoji, description, is_premium) VALUES
  ('Nutra', 'nutra', '💊', 'Suplementos e produtos naturais', false),
  ('PLR', 'plr', '📚', 'Private Label Rights', false),
  ('E-commerce', 'ecommerce', '🛒', 'Produtos físicos e digitais', false),
  ('BizOpp', 'bizopp', '💼', 'Oportunidades de negócio', false),
  ('Finance', 'finance', '💰', 'Produtos financeiros', false),
  ('Crypto', 'crypto', '₿', 'Criptomoedas e blockchain', false),
  ('Beauty', 'beauty', '✨', 'Produtos de beleza', false),
  ('Sexual Health', 'sexual-health', '❤️', 'Saúde sexual', false)
ON CONFLICT (slug) DO NOTHING;


