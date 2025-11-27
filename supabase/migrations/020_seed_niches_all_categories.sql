-- ============================================
-- SEED NICHES FOR ALL CATEGORIES
-- Migration 020: Inserir todos os nichos para TODAS as categorias
-- ============================================

-- Esta migração cria cada nicho em TODAS as categorias disponíveis
-- Assim, qualquer categoria terá acesso a todos os nichos

DO $$
DECLARE
  category_record RECORD;
  niche_name TEXT;
  niche_slug TEXT;
  niche_description TEXT;
  all_niches TEXT[][] := ARRAY[
    -- Nichos gerais que fazem sentido para todas as categorias
    ARRAY['Emagrecimento', 'emagrecimento', 'Produtos para perda de peso e queima de gordura'],
    ARRAY['Ganho de Massa', 'ganho-de-massa', 'Suplementos para ganho de massa muscular'],
    ARRAY['Energia e Performance', 'energia-performance', 'Produtos para aumentar energia e performance'],
    ARRAY['Saúde Digestiva', 'saude-digestiva', 'Probióticos e produtos para digestão'],
    ARRAY['Saúde Articular', 'saude-articular', 'Produtos para articulações e mobilidade'],
    ARRAY['Imunidade', 'imunidade', 'Suplementos para fortalecer o sistema imunológico'],
    ARRAY['Beleza e Cabelo', 'beleza-cabelo', 'Produtos para cabelo, pele e unhas'],
    ARRAY['Sono e Relaxamento', 'sono-relaxamento', 'Produtos para melhorar o sono'],
    ARRAY['Anti-Envelhecimento', 'anti-envelhecimento', 'Produtos anti-aging e longevidade'],
    ARRAY['Saúde Masculina', 'saude-masculina', 'Suplementos específicos para homens'],
    ARRAY['Saúde Feminina', 'saude-feminina', 'Suplementos específicos para mulheres'],
    ARRAY['Cognição e Memória', 'cognicao-memoria', 'Produtos para melhorar foco e memória'],
    ARRAY['Detox', 'detox', 'Produtos para desintoxicação'],
    ARRAY['Vegetarianos e Veganos', 'vegetarianos-veganos', 'Suplementos para dietas vegetarianas'],
    ARRAY['Atletas', 'atletas', 'Suplementos para atletas e esportistas'],
    ARRAY['Marketing Digital', 'marketing-digital', 'Cursos e produtos de marketing digital'],
    ARRAY['Empreendedorismo', 'empreendedorismo', 'Conteúdo sobre negócios e empreendedorismo'],
    ARRAY['Desenvolvimento Pessoal', 'desenvolvimento-pessoal', 'Produtos de autoajuda e crescimento pessoal'],
    ARRAY['Finanças Pessoais', 'financas-pessoais', 'Educação financeira e investimentos'],
    ARRAY['Fitness e Treino', 'fitness-treino', 'Programas de exercícios e treinamento'],
    ARRAY['Nutrição e Dieta', 'nutricao-dieta', 'Planos alimentares e receitas'],
    ARRAY['Relacionamentos', 'relacionamentos', 'Produtos sobre relacionamentos e sedução'],
    ARRAY['Parenting', 'parenting', 'Conteúdo para pais e criação de filhos'],
    ARRAY['Educação Online', 'educacao-online', 'Cursos e materiais educacionais'],
    ARRAY['Criatividade e Arte', 'criatividade-arte', 'Produtos sobre arte e criatividade'],
    ARRAY['Tecnologia', 'tecnologia', 'Cursos de programação e tecnologia'],
    ARRAY['Idiomas', 'idiomas', 'Cursos de idiomas e aprendizado'],
    ARRAY['Música', 'musica', 'Cursos e produtos musicais'],
    ARRAY['Fotografia', 'fotografia', 'Cursos de fotografia'],
    ARRAY['Escrita', 'escrita', 'Produtos sobre escrita e redação'],
    ARRAY['Moda e Vestuário', 'moda-vestuario', 'Roupas, acessórios e moda'],
    ARRAY['Eletrônicos', 'eletronicos', 'Gadgets e aparelhos eletrônicos'],
    ARRAY['Casa e Decoração', 'casa-decoracao', 'Produtos para casa e decoração'],
    ARRAY['Esportes e Fitness', 'esportes-fitness', 'Equipamentos esportivos'],
    ARRAY['Beleza e Cuidados', 'beleza-cuidados', 'Produtos de beleza e cuidados pessoais'],
    ARRAY['Saúde e Bem-estar', 'saude-bemestar', 'Produtos de saúde e bem-estar'],
    ARRAY['Brinquedos e Jogos', 'brinquedos-jogos', 'Brinquedos e jogos'],
    ARRAY['Livros e Mídia', 'livros-midia', 'Livros, e-books e mídia digital'],
    ARRAY['Pet Shop', 'pet-shop', 'Produtos para animais de estimação'],
    ARRAY['Automotivo', 'automotivo', 'Acessórios e peças automotivas'],
    ARRAY['Ferramentas', 'ferramentas', 'Ferramentas e equipamentos'],
    ARRAY['Jóias e Relógios', 'joias-relogios', 'Jóias, relógios e acessórios'],
    ARRAY['Alimentos e Bebidas', 'alimentos-bebidas', 'Produtos alimentícios'],
    ARRAY['Viagem e Turismo', 'viagem-turismo', 'Produtos para viagem'],
    ARRAY['Maternidade e Bebê', 'maternidade-bebe', 'Produtos para mães e bebês'],
    ARRAY['Afiliados', 'afiliados', 'Programas de afiliados e comissões'],
    ARRAY['Dropshipping', 'dropshipping', 'Oportunidades de dropshipping'],
    ARRAY['MLM e Network Marketing', 'mlm-network-marketing', 'Marketing multinível'],
    ARRAY['Investimentos', 'investimentos', 'Oportunidades de investimento'],
    ARRAY['Franquias', 'franquias', 'Oportunidades de franquia'],
    ARRAY['Home Based Business', 'home-based-business', 'Negócios home office'],
    ARRAY['Importação e Exportação', 'importacao-exportacao', 'Negócios de importação'],
    ARRAY['Consultoria', 'consultoria', 'Oportunidades de consultoria'],
    ARRAY['Coaching', 'coaching', 'Negócios de coaching'],
    ARRAY['SaaS e Software', 'saas-software', 'Oportunidades em software'],
    ARRAY['E-commerce Dropshipping', 'ecommerce-dropshipping', 'E-commerce com dropshipping'],
    ARRAY['Agência Digital', 'agencia-digital', 'Oportunidades em agências'],
    ARRAY['Infoprodutos', 'infoprodutos', 'Criação e venda de infoprodutos'],
    ARRAY['Marketplace', 'marketplace', 'Oportunidades em marketplaces'],
    ARRAY['Automação de Negócios', 'automacao-negocios', 'Sistemas automatizados'],
    ARRAY['Empréstimos Pessoais', 'emprestimos-pessoais', 'Empréstimos e crédito pessoal'],
    ARRAY['Cartões de Crédito', 'cartoes-credito', 'Ofertas de cartões de crédito'],
    ARRAY['Seguros', 'seguros', 'Seguros diversos'],
    ARRAY['Consolidação de Dívidas', 'consolidacao-dividas', 'Produtos para quitar dívidas'],
    ARRAY['Educação Financeira', 'educacao-financeira', 'Cursos de educação financeira'],
    ARRAY['Trading', 'trading', 'Plataformas de trading'],
    ARRAY['Forex', 'forex', 'Oportunidades em Forex'],
    ARRAY['Crowdfunding', 'crowdfunding', 'Plataformas de crowdfunding'],
    ARRAY['Fintech', 'fintech', 'Produtos fintech'],
    ARRAY['Conta Digital', 'conta-digital', 'Contas digitais e bancos online'],
    ARRAY['Cashback', 'cashback', 'Programas de cashback'],
    ARRAY['Cartão Pré-pago', 'cartao-pre-pago', 'Cartões pré-pagos'],
    ARRAY['Financiamento', 'financiamento', 'Financiamentos diversos'],
    ARRAY['Aposentadoria', 'aposentadoria', 'Produtos para aposentadoria'],
    ARRAY['Bitcoin', 'bitcoin', 'Produtos relacionados a Bitcoin'],
    ARRAY['Altcoins', 'altcoins', 'Outras criptomoedas'],
    ARRAY['Trading de Crypto', 'trading-crypto', 'Plataformas de trading de cripto'],
    ARRAY['NFTs', 'nfts', 'Produtos e marketplaces de NFTs'],
    ARRAY['DeFi', 'defi', 'Produtos de finanças descentralizadas'],
    ARRAY['Staking', 'staking', 'Plataformas de staking'],
    ARRAY['Mining', 'mining', 'Produtos de mineração'],
    ARRAY['Wallets', 'wallets', 'Carteiras de criptomoedas'],
    ARRAY['Exchanges', 'exchanges', 'Corretoras de criptomoedas'],
    ARRAY['Educação Crypto', 'educacao-crypto', 'Cursos sobre criptomoedas'],
    ARRAY['Metaverso', 'metaverso', 'Produtos do metaverso'],
    ARRAY['Web3', 'web3', 'Produtos Web3'],
    ARRAY['Smart Contracts', 'smart-contracts', 'Produtos de smart contracts'],
    ARRAY['Tokenização', 'tokenizacao', 'Produtos de tokenização'],
    ARRAY['Blockchain', 'blockchain', 'Produtos de blockchain'],
    ARRAY['Skincare', 'skincare', 'Produtos de cuidados com a pele'],
    ARRAY['Maquiagem', 'maquiagem', 'Produtos de maquiagem'],
    ARRAY['Cabelo', 'cabelo', 'Produtos para cabelo'],
    ARRAY['Unhas', 'unhas', 'Produtos para unhas'],
    ARRAY['Perfumes', 'perfumes', 'Perfumes e fragrâncias'],
    ARRAY['Anti-Idade', 'anti-idade', 'Produtos anti-envelhecimento'],
    ARRAY['Acne e Espinhas', 'acne-espinhas', 'Tratamentos para acne'],
    ARRAY['Hidratação', 'hidratacao', 'Produtos hidratantes'],
    ARRAY['Proteção Solar', 'protecao-solar', 'Protetores solares'],
    ARRAY['Cuidados Masculinos', 'cuidados-masculinos', 'Produtos de beleza masculina'],
    ARRAY['Cuidados Femininos', 'cuidados-femininos', 'Produtos de beleza feminina'],
    ARRAY['Cabelos Coloridos', 'cabelos-coloridos', 'Produtos para cabelos coloridos'],
    ARRAY['Cabelos Cacheados', 'cabelos-cacheados', 'Produtos para cachos'],
    ARRAY['Cabelos Lisos', 'cabelos-lisos', 'Produtos para cabelos lisos'],
    ARRAY['Tratamentos Capilares', 'tratamentos-capilares', 'Tratamentos para cabelo'],
    ARRAY['Disfunção Erétil', 'disfuncao-eretil', 'Tratamentos para disfunção erétil'],
    ARRAY['Libido', 'libido', 'Produtos para aumentar libido'],
    ARRAY['Performance Sexual', 'performance-sexual', 'Produtos para performance'],
    ARRAY['Relacionamentos Íntimos', 'relacionamentos-intimos', 'Produtos para relacionamentos'],
    ARRAY['Bem-estar Sexual', 'bemestar-sexual', 'Produtos de bem-estar sexual'],
    ARRAY['Saúde Masculina Sexual', 'saude-masculina-sexual', 'Saúde sexual masculina'],
    ARRAY['Saúde Feminina Sexual', 'saude-feminina-sexual', 'Saúde sexual feminina'],
    ARRAY['Casais', 'casais', 'Produtos para casais'],
    ARRAY['Educação Sexual', 'educacao-sexual', 'Conteúdo educacional'],
    ARRAY['Bem-estar Íntimo', 'bemestar-intimo', 'Produtos de bem-estar íntimo']
  ];
  niche_array TEXT[];
  final_slug TEXT;
  row_count INTEGER;
  total_inserted INTEGER := 0;
  category_count INTEGER;
BEGIN
  -- Verificar se existem categorias
  SELECT COUNT(*) INTO category_count FROM categories;
  
  IF category_count = 0 THEN
    RAISE EXCEPTION 'Nenhuma categoria encontrada. Execute primeiro a migração de seed de categorias.';
  END IF;
  
  RAISE NOTICE 'Encontradas % categorias. Inserindo nichos...', category_count;
  
  -- Para cada categoria
  FOR category_record IN SELECT id, slug FROM categories ORDER BY slug LOOP
    RAISE NOTICE 'Processando categoria: %', category_record.slug;
    -- Para cada nicho
    FOREACH niche_array SLICE 1 IN ARRAY all_niches LOOP
      niche_name := niche_array[1];
      niche_slug := niche_array[2];
      niche_description := niche_array[3];
      
      -- Criar slug único combinando o slug do nicho com o slug da categoria
      final_slug := niche_slug || '-' || category_record.slug;
      
      -- Inserir o nicho para esta categoria
      INSERT INTO niches (name, slug, category_id, description, is_active)
      VALUES (niche_name, final_slug, category_record.id, niche_description, true)
      ON CONFLICT (slug) DO NOTHING;
      
      -- Contar inserções bem-sucedidas
      GET DIAGNOSTICS row_count = ROW_COUNT;
      total_inserted := total_inserted + row_count;
    END LOOP;
  END LOOP;
  
  RAISE NOTICE 'Migração concluída! % nichos inseridos para % categorias.', total_inserted, category_count;
  RAISE NOTICE 'Agora todas as categorias têm acesso a todos os nichos!';
END $$;

