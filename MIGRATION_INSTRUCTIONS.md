# Instruções para Executar Migrações

## Problemas Comuns

### 1. Tabela 'niches' não encontrada
Se você está recebendo o erro "Could not find the table 'public.niches' in the schema cache", você precisa executar a migração 017.

### 2. Coluna 'drive_copy_url' não encontrada
Se você está recebendo o erro "Could not find the 'drive_copy_url' column of 'offers' in the schema cache", você precisa executar a migração 018.

## Como executar a migração:

### Opção 1: Via Supabase Dashboard (Recomendado)

1. Acesse o [Supabase Dashboard](https://app.supabase.com)
2. Selecione seu projeto
3. Vá para **SQL Editor** no menu lateral
4. Clique em **New Query**
5. Copie e cole o conteúdo do arquivo `supabase/migrations/017_ensure_niches_table.sql`
6. Clique em **Run** ou pressione `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)

### Opção 2: Via Supabase CLI

Se você tem o Supabase CLI instalado:

```bash
# Certifique-se de estar conectado ao seu projeto
supabase db push

# Ou execute a migração específica
supabase migration up
```

### Opção 3: Executar todas as migrações pendentes

Se você ainda não executou as migrações anteriores, execute na seguinte ordem:

1. **017_ensure_niches_table.sql** - Cria a tabela `niches` (se não existir)
2. **018_ensure_offers_columns.sql** - Adiciona colunas necessárias na tabela `offers`
3. **020_seed_niches_all_categories.sql** - ⭐ **IMPORTANTE**: Insere TODOS os nichos para TODAS as categorias (RECOMENDADO)
4. **019_seed_niches.sql** - Insere nichos organizados por categoria específica (OPCIONAL)

**OU** execute todas as migrações anteriores na ordem:
1. `supabase/migrations/008_complete_schema_updates.sql` - Schema completo
2. `supabase/migrations/009_rls_policies_new_tables.sql` - Políticas RLS
3. `supabase/migrations/017_ensure_niches_table.sql` - Garantir tabela niches
4. `supabase/migrations/018_ensure_offers_columns.sql` - Garantir colunas em offers
5. `supabase/migrations/019_seed_niches.sql` - Popular nichos (OPCIONAL)

## Verificar se as migrações foram executadas:

Após executar as migrações, você pode verificar se foram aplicadas:

### Verificar tabela niches:
```sql
-- No SQL Editor do Supabase
SELECT * FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'niches';
```

### Verificar colunas da tabela offers:
```sql
-- Verificar se as colunas existem
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'offers'
AND column_name IN ('niche_id', 'facebook_ads_url', 'vsl_url', 'drive_copy_url', 'drive_creatives_url', 'quiz_url');
```

Se tudo estiver correto, você verá as linhas retornadas.

## Após executar as migrações:

1. **Aguarde alguns segundos** para o cache do Supabase atualizar (geralmente 1-2 minutos)
2. **Recarregue a página** da aplicação (Ctrl+F5 ou Cmd+Shift+R para forçar recarregamento)
3. **Tente novamente** criar uma oferta ou nicho
4. Os erros devem desaparecer

## Ordem Recomendada de Execução:

Execute as migrações nesta ordem para evitar erros:

1. **017_ensure_niches_table.sql** - Primeiro, crie a tabela niches
2. **018_ensure_offers_columns.sql** - Depois, adicione as colunas em offers
3. **020_seed_niches_all_categories.sql** - ⭐ **IMPORTANTE**: Popule com TODOS os nichos para TODAS as categorias (RECOMENDADO)
4. **019_seed_niches.sql** - (OPCIONAL) Nichos organizados por categoria específica

## ⭐ Sobre a Migração 020 (TODOS os Nichos para TODAS as Categorias):

A migração `020_seed_niches_all_categories.sql` é a **MAIS IMPORTANTE**! Ela insere **TODOS os nichos para TODAS as categorias** disponíveis.

### O que ela faz:
- Busca **todas as categorias** cadastradas no banco
- Para cada categoria, insere **todos os 100+ nichos populares**
- Cria slugs únicos combinando o nicho com a categoria (ex: `emagrecimento-nutra`, `emagrecimento-plr`, etc.)

### Resultado:
- **Cada categoria terá acesso a TODOS os nichos**
- Não importa qual categoria você selecionar, sempre haverá nichos disponíveis
- **Total: 100+ nichos × 8 categorias = 800+ combinações!**

### Exemplo:
Se você selecionar a categoria "Nutra", verá:
- Emagrecimento
- Marketing Digital
- Bitcoin
- Skincare
- E todos os outros 100+ nichos!

## Sobre a Migração 019 (Seed de Nichos por Categoria):

A migração `019_seed_niches.sql` insere nichos organizados por categoria específica (cada nicho em apenas uma categoria). Use esta se preferir nichos mais específicos por categoria.

**Recomendação: Use a migração 020 para ter todos os nichos disponíveis em todas as categorias!**

Ambas as migrações são seguras e usam `ON CONFLICT (slug) DO NOTHING`, então podem ser executadas múltiplas vezes sem problemas.

## ⚠️ IMPORTANTE: Corrigir Loop Infinito de Profiles

Se você está vendo o erro `42P17: infinite recursion detected in policy for relation "profiles"`, execute a migração:

**021_fix_infinite_recursion_profiles.sql** - Esta migração corrige o loop infinito nas políticas RLS do profiles.

### Ordem de execução completa:

1. **017_ensure_niches_table.sql** - Criar tabela niches
2. **018_ensure_offers_columns.sql** - Adicionar colunas em offers
3. **021_fix_infinite_recursion_profiles.sql** - ⚠️ **CRÍTICO**: Corrigir loop infinito
4. **020_seed_niches_all_categories.sql** - Popular nichos (OPCIONAL)
5. **019_seed_niches.sql** - Nichos por categoria (OPCIONAL)

## Nota importante:

Se você ainda receber erros após executar a migração, pode ser necessário:
- Limpar o cache do Supabase (isso geralmente acontece automaticamente após alguns minutos)
- Verificar se todas as variáveis de ambiente estão configuradas corretamente (`.env.local`)
- Verificar se o usuário tem permissões de admin no banco de dados
- **Recarregar a página completamente** (Ctrl+Shift+R ou Cmd+Shift+R) após executar a migração 021

