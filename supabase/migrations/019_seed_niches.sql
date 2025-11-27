-- ============================================
-- SEED NICHES - Popular Niches Worldwide
-- Migration 019: Inserir nichos populares do mundo todo
-- ============================================

-- Função auxiliar para obter category_id por slug
DO $$
DECLARE
  nutra_id UUID;
  plr_id UUID;
  ecommerce_id UUID;
  bizopp_id UUID;
  finance_id UUID;
  crypto_id UUID;
  beauty_id UUID;
  sexual_health_id UUID;
BEGIN
  -- Buscar IDs das categorias
  SELECT id INTO nutra_id FROM categories WHERE slug = 'nutra' LIMIT 1;
  SELECT id INTO plr_id FROM categories WHERE slug = 'plr' LIMIT 1;
  SELECT id INTO ecommerce_id FROM categories WHERE slug = 'ecommerce' LIMIT 1;
  SELECT id INTO bizopp_id FROM categories WHERE slug = 'bizopp' LIMIT 1;
  SELECT id INTO finance_id FROM categories WHERE slug = 'finance' LIMIT 1;
  SELECT id INTO crypto_id FROM categories WHERE slug = 'crypto' LIMIT 1;
  SELECT id INTO beauty_id FROM categories WHERE slug = 'beauty' LIMIT 1;
  SELECT id INTO sexual_health_id FROM categories WHERE slug = 'sexual-health' LIMIT 1;

  -- ============================================
  -- NICHES PARA NUTRA (Suplementos e Produtos Naturais)
  -- ============================================
  INSERT INTO niches (name, slug, category_id, description, is_active) VALUES
    ('Emagrecimento', 'emagrecimento', nutra_id, 'Produtos para perda de peso e queima de gordura', true),
    ('Ganho de Massa', 'ganho-de-massa', nutra_id, 'Suplementos para ganho de massa muscular', true),
    ('Energia e Performance', 'energia-performance', nutra_id, 'Produtos para aumentar energia e performance', true),
    ('Saúde Digestiva', 'saude-digestiva', nutra_id, 'Probióticos e produtos para digestão', true),
    ('Saúde Articular', 'saude-articular', nutra_id, 'Produtos para articulações e mobilidade', true),
    ('Imunidade', 'imunidade', nutra_id, 'Suplementos para fortalecer o sistema imunológico', true),
    ('Beleza e Cabelo', 'beleza-cabelo', nutra_id, 'Produtos para cabelo, pele e unhas', true),
    ('Sono e Relaxamento', 'sono-relaxamento', nutra_id, 'Produtos para melhorar o sono', true),
    ('Anti-Envelhecimento', 'anti-envelhecimento', nutra_id, 'Produtos anti-aging e longevidade', true),
    ('Saúde Masculina', 'saude-masculina', nutra_id, 'Suplementos específicos para homens', true),
    ('Saúde Feminina', 'saude-feminina', nutra_id, 'Suplementos específicos para mulheres', true),
    ('Cognição e Memória', 'cognicao-memoria', nutra_id, 'Produtos para melhorar foco e memória', true),
    ('Detox', 'detox', nutra_id, 'Produtos para desintoxicação', true),
    ('Vegetarianos e Veganos', 'vegetarianos-veganos', nutra_id, 'Suplementos para dietas vegetarianas', true),
    ('Atletas', 'atletas', nutra_id, 'Suplementos para atletas e esportistas', true)
  ON CONFLICT (slug) DO NOTHING;

  -- ============================================
  -- NICHES PARA PLR (Private Label Rights)
  -- ============================================
  INSERT INTO niches (name, slug, category_id, description, is_active) VALUES
    ('Marketing Digital', 'marketing-digital', plr_id, 'Cursos e produtos de marketing digital', true),
    ('Empreendedorismo', 'empreendedorismo', plr_id, 'Conteúdo sobre negócios e empreendedorismo', true),
    ('Desenvolvimento Pessoal', 'desenvolvimento-pessoal', plr_id, 'Produtos de autoajuda e crescimento pessoal', true),
    ('Finanças Pessoais', 'financas-pessoais', plr_id, 'Educação financeira e investimentos', true),
    ('Fitness e Treino', 'fitness-treino', plr_id, 'Programas de exercícios e treinamento', true),
    ('Nutrição e Dieta', 'nutricao-dieta', plr_id, 'Planos alimentares e receitas', true),
    ('Relacionamentos', 'relacionamentos', plr_id, 'Produtos sobre relacionamentos e sedução', true),
    ('Parenting', 'parenting', plr_id, 'Conteúdo para pais e criação de filhos', true),
    ('Educação Online', 'educacao-online', plr_id, 'Cursos e materiais educacionais', true),
    ('Criatividade e Arte', 'criatividade-arte', plr_id, 'Produtos sobre arte e criatividade', true),
    ('Tecnologia', 'tecnologia', plr_id, 'Cursos de programação e tecnologia', true),
    ('Idiomas', 'idiomas', plr_id, 'Cursos de idiomas e aprendizado', true),
    ('Música', 'musica', plr_id, 'Cursos e produtos musicais', true),
    ('Fotografia', 'fotografia', plr_id, 'Cursos de fotografia', true),
    ('Escrita', 'escrita', plr_id, 'Produtos sobre escrita e redação', true)
  ON CONFLICT (slug) DO NOTHING;

  -- ============================================
  -- NICHES PARA E-COMMERCE
  -- ============================================
  INSERT INTO niches (name, slug, category_id, description, is_active) VALUES
    ('Moda e Vestuário', 'moda-vestuario', ecommerce_id, 'Roupas, acessórios e moda', true),
    ('Eletrônicos', 'eletronicos', ecommerce_id, 'Gadgets e aparelhos eletrônicos', true),
    ('Casa e Decoração', 'casa-decoracao', ecommerce_id, 'Produtos para casa e decoração', true),
    ('Esportes e Fitness', 'esportes-fitness', ecommerce_id, 'Equipamentos esportivos', true),
    ('Beleza e Cuidados', 'beleza-cuidados', ecommerce_id, 'Produtos de beleza e cuidados pessoais', true),
    ('Saúde e Bem-estar', 'saude-bemestar', ecommerce_id, 'Produtos de saúde e bem-estar', true),
    ('Brinquedos e Jogos', 'brinquedos-jogos', ecommerce_id, 'Brinquedos e jogos', true),
    ('Livros e Mídia', 'livros-midia', ecommerce_id, 'Livros, e-books e mídia digital', true),
    ('Pet Shop', 'pet-shop', ecommerce_id, 'Produtos para animais de estimação', true),
    ('Automotivo', 'automotivo', ecommerce_id, 'Acessórios e peças automotivas', true),
    ('Ferramentas', 'ferramentas', ecommerce_id, 'Ferramentas e equipamentos', true),
    ('Jóias e Relógios', 'joias-relogios', ecommerce_id, 'Jóias, relógios e acessórios', true),
    ('Alimentos e Bebidas', 'alimentos-bebidas', ecommerce_id, 'Produtos alimentícios', true),
    ('Viagem e Turismo', 'viagem-turismo', ecommerce_id, 'Produtos para viagem', true),
    ('Maternidade e Bebê', 'maternidade-bebe', ecommerce_id, 'Produtos para mães e bebês', true)
  ON CONFLICT (slug) DO NOTHING;

  -- ============================================
  -- NICHES PARA BIZOPP (Oportunidades de Negócio)
  -- ============================================
  INSERT INTO niches (name, slug, category_id, description, is_active) VALUES
    ('Afiliados', 'afiliados', bizopp_id, 'Programas de afiliados e comissões', true),
    ('Dropshipping', 'dropshipping', bizopp_id, 'Oportunidades de dropshipping', true),
    ('MLM e Network Marketing', 'mlm-network-marketing', bizopp_id, 'Marketing multinível', true),
    ('Investimentos', 'investimentos', bizopp_id, 'Oportunidades de investimento', true),
    ('Franquias', 'franquias', bizopp_id, 'Oportunidades de franquia', true),
    ('Home Based Business', 'home-based-business', bizopp_id, 'Negócios home office', true),
    ('Importação e Exportação', 'importacao-exportacao', bizopp_id, 'Negócios de importação', true),
    ('Consultoria', 'consultoria', bizopp_id, 'Oportunidades de consultoria', true),
    ('Coaching', 'coaching', bizopp_id, 'Negócios de coaching', true),
    ('SaaS e Software', 'saas-software', bizopp_id, 'Oportunidades em software', true),
    ('E-commerce Dropshipping', 'ecommerce-dropshipping', bizopp_id, 'E-commerce com dropshipping', true),
    ('Agência Digital', 'agencia-digital', bizopp_id, 'Oportunidades em agências', true),
    ('Infoprodutos', 'infoprodutos', bizopp_id, 'Criação e venda de infoprodutos', true),
    ('Marketplace', 'marketplace', bizopp_id, 'Oportunidades em marketplaces', true),
    ('Automação de Negócios', 'automacao-negocios', bizopp_id, 'Sistemas automatizados', true)
  ON CONFLICT (slug) DO NOTHING;

  -- ============================================
  -- NICHES PARA FINANCE (Produtos Financeiros)
  -- ============================================
  INSERT INTO niches (name, slug, category_id, description, is_active) VALUES
    ('Empréstimos Pessoais', 'emprestimos-pessoais', finance_id, 'Empréstimos e crédito pessoal', true),
    ('Cartões de Crédito', 'cartoes-credito', finance_id, 'Ofertas de cartões de crédito', true),
    ('Investimentos', 'investimentos-finance', finance_id, 'Produtos de investimento', true),
    ('Seguros', 'seguros', finance_id, 'Seguros diversos', true),
    ('Consolidação de Dívidas', 'consolidacao-dividas', finance_id, 'Produtos para quitar dívidas', true),
    ('Educação Financeira', 'educacao-financeira', finance_id, 'Cursos de educação financeira', true),
    ('Trading', 'trading', finance_id, 'Plataformas de trading', true),
    ('Forex', 'forex', finance_id, 'Oportunidades em Forex', true),
    ('Crowdfunding', 'crowdfunding', finance_id, 'Plataformas de crowdfunding', true),
    ('Fintech', 'fintech', finance_id, 'Produtos fintech', true),
    ('Conta Digital', 'conta-digital', finance_id, 'Contas digitais e bancos online', true),
    ('Cashback', 'cashback', finance_id, 'Programas de cashback', true),
    ('Cartão Pré-pago', 'cartao-pre-pago', finance_id, 'Cartões pré-pagos', true),
    ('Financiamento', 'financiamento', finance_id, 'Financiamentos diversos', true),
    ('Aposentadoria', 'aposentadoria', finance_id, 'Produtos para aposentadoria', true)
  ON CONFLICT (slug) DO NOTHING;

  -- ============================================
  -- NICHES PARA CRYPTO (Criptomoedas)
  -- ============================================
  INSERT INTO niches (name, slug, category_id, description, is_active) VALUES
    ('Bitcoin', 'bitcoin', crypto_id, 'Produtos relacionados a Bitcoin', true),
    ('Altcoins', 'altcoins', crypto_id, 'Outras criptomoedas', true),
    ('Trading de Crypto', 'trading-crypto', crypto_id, 'Plataformas de trading de cripto', true),
    ('NFTs', 'nfts', crypto_id, 'Produtos e marketplaces de NFTs', true),
    ('DeFi', 'defi', crypto_id, 'Produtos de finanças descentralizadas', true),
    ('Staking', 'staking', crypto_id, 'Plataformas de staking', true),
    ('Mining', 'mining', crypto_id, 'Produtos de mineração', true),
    ('Wallets', 'wallets', crypto_id, 'Carteiras de criptomoedas', true),
    ('Exchanges', 'exchanges', crypto_id, 'Corretoras de criptomoedas', true),
    ('Educação Crypto', 'educacao-crypto', crypto_id, 'Cursos sobre criptomoedas', true),
    ('Metaverso', 'metaverso', crypto_id, 'Produtos do metaverso', true),
    ('Web3', 'web3', crypto_id, 'Produtos Web3', true),
    ('Smart Contracts', 'smart-contracts', crypto_id, 'Produtos de smart contracts', true),
    ('Tokenização', 'tokenizacao', crypto_id, 'Produtos de tokenização', true),
    ('Blockchain', 'blockchain', crypto_id, 'Produtos de blockchain', true)
  ON CONFLICT (slug) DO NOTHING;

  -- ============================================
  -- NICHES PARA BEAUTY (Beleza)
  -- ============================================
  INSERT INTO niches (name, slug, category_id, description, is_active) VALUES
    ('Skincare', 'skincare', beauty_id, 'Produtos de cuidados com a pele', true),
    ('Maquiagem', 'maquiagem', beauty_id, 'Produtos de maquiagem', true),
    ('Cabelo', 'cabelo', beauty_id, 'Produtos para cabelo', true),
    ('Unhas', 'unhas', beauty_id, 'Produtos para unhas', true),
    ('Perfumes', 'perfumes', beauty_id, 'Perfumes e fragrâncias', true),
    ('Anti-Idade', 'anti-idade', beauty_id, 'Produtos anti-envelhecimento', true),
    ('Acne e Espinhas', 'acne-espinhas', beauty_id, 'Tratamentos para acne', true),
    ('Hidratação', 'hidratacao', beauty_id, 'Produtos hidratantes', true),
    ('Proteção Solar', 'protecao-solar', beauty_id, 'Protetores solares', true),
    ('Cuidados Masculinos', 'cuidados-masculinos', beauty_id, 'Produtos de beleza masculina', true),
    ('Cuidados Femininos', 'cuidados-femininos', beauty_id, 'Produtos de beleza feminina', true),
    ('Cabelos Coloridos', 'cabelos-coloridos', beauty_id, 'Produtos para cabelos coloridos', true),
    ('Cabelos Cacheados', 'cabelos-cacheados', beauty_id, 'Produtos para cachos', true),
    ('Cabelos Lisos', 'cabelos-lisos', beauty_id, 'Produtos para cabelos lisos', true),
    ('Tratamentos Capilares', 'tratamentos-capilares', beauty_id, 'Tratamentos para cabelo', true)
  ON CONFLICT (slug) DO NOTHING;

  -- ============================================
  -- NICHES PARA SEXUAL HEALTH (Saúde Sexual)
  -- ============================================
  INSERT INTO niches (name, slug, category_id, description, is_active) VALUES
    ('Disfunção Erétil', 'disfuncao-eretil', sexual_health_id, 'Tratamentos para disfunção erétil', true),
    ('Libido', 'libido', sexual_health_id, 'Produtos para aumentar libido', true),
    ('Performance Sexual', 'performance-sexual', sexual_health_id, 'Produtos para performance', true),
    ('Relacionamentos Íntimos', 'relacionamentos-intimos', sexual_health_id, 'Produtos para relacionamentos', true),
    ('Bem-estar Sexual', 'bemestar-sexual', sexual_health_id, 'Produtos de bem-estar sexual', true),
    ('Saúde Masculina', 'saude-masculina-sexual', sexual_health_id, 'Saúde sexual masculina', true),
    ('Saúde Feminina', 'saude-feminina-sexual', sexual_health_id, 'Saúde sexual feminina', true),
    ('Casais', 'casais', sexual_health_id, 'Produtos para casais', true),
    ('Educação Sexual', 'educacao-sexual', sexual_health_id, 'Conteúdo educacional', true),
    ('Bem-estar Íntimo', 'bemestar-intimo', sexual_health_id, 'Produtos de bem-estar íntimo', true)
  ON CONFLICT (slug) DO NOTHING;

  RAISE NOTICE 'Nichos inseridos com sucesso!';
END $$;


