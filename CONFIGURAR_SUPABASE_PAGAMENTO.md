# 🔧 Configuração do Supabase para Sistema de Pagamento

## ⚠️ IMPORTANTE
Antes de usar o sistema de pagamento, você precisa configurar o banco de dados no Supabase.

## 📋 Checklist de Configuração

### 1. ✅ Executar Migrations

Execute as seguintes migrations no SQL Editor do Supabase (na ordem):

#### Migration 058: Atualizar tabelas para M-Pesa/e-Mola
```sql
-- Execute: supabase/migrations/058_update_payments_for_mpesa_emola.sql
```

Esta migration adiciona os campos necessários:
- `amount` (DECIMAL) na tabela `payments`
- `method` (TEXT) na tabela `payments` (mpesa, emola)
- `transaction_id` (TEXT) na tabela `payments`
- `payment_type` (TEXT) na tabela `payments`
- `notes` (TEXT) na tabela `payments`
- `payment_date` (TIMESTAMPTZ) na tabela `payments`
- `plan_name` (TEXT) na tabela `subscriptions`
- `price` (DECIMAL) na tabela `subscriptions`
- `is_trial` (BOOLEAN) na tabela `subscriptions`
- `trial_ends_at` (TIMESTAMPTZ) na tabela `subscriptions`

### 2. ✅ Verificar se as Tabelas Existem

Execute este SQL para verificar:

```sql
-- Verificar tabelas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('payments', 'subscriptions', 'plans', 'profiles');
```

Se alguma tabela não existir, execute a migration `COMPLETE_SETUP.sql` ou `001_initial_schema.sql`.

### 3. ✅ Criar Planos no Banco de Dados

Execute este SQL para criar os planos:

**OPÇÃO 1: Planos Elite e Founder (recomendado)**
```sql
-- Criar planos Elite e Founder
INSERT INTO "public"."plans" 
  ("id", "name", "slug", "description", "price_monthly_cents", "max_offers_visible", "max_favorites", "is_active", "created_at") 
VALUES 
  ('4ba2e498-8c3d-4d7d-8b53-7753c3a82fe7', 'Elite', 'elite', 'Acesso completo e ilimitado', 19700, null, null, true, NOW()),
  ('cf007f5a-0ec8-46ed-a6e2-4544709e2974', 'Founder', 'founder', 'Para quem está começando a escalar', 14700, 200, null, true, NOW())
ON CONFLICT (slug) DO UPDATE
SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_monthly_cents = EXCLUDED.price_monthly_cents,
  max_offers_visible = EXCLUDED.max_offers_visible,
  max_favorites = EXCLUDED.max_favorites,
  is_active = EXCLUDED.is_active;
```

**OPÇÃO 2: Planos Mensal, Trimestral e Anual (alternativa)**
```sql
-- Criar planos
INSERT INTO plans (name, slug, description, price_monthly_cents, is_active)
VALUES 
  ('Mensal', 'mensal', 'Plano mensal - 1 MT', 100, true),
  ('Trimestral', 'trimestral', 'Plano trimestral - 2.7 MT (10% desconto)', 90, true),
  ('Anual', 'anual', 'Plano anual - 9.6 MT (20% desconto)', 80, true)
ON CONFLICT (slug) DO UPDATE
SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_monthly_cents = EXCLUDED.price_monthly_cents,
  is_active = EXCLUDED.is_active;
```

**Nota:** 
- Os valores estão em centavos (1 MT = 100 centavos)
- O arquivo `CRIAR_PLANOS.sql` contém o script completo para criar os planos Elite e Founder

### 4. ✅ Configurar Políticas RLS (Row Level Security)

Execute este SQL para configurar as políticas de segurança:

```sql
-- Habilitar RLS nas tabelas
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Política para payments: usuários podem ver seus próprios pagamentos
DROP POLICY IF EXISTS "Users can view their own payments" ON payments;
CREATE POLICY "Users can view their own payments"
  ON payments FOR SELECT
  USING (auth.uid() = user_id);

-- Política para payments: usuários podem inserir seus próprios pagamentos
DROP POLICY IF EXISTS "Users can insert their own payments" ON payments;
CREATE POLICY "Users can insert their own payments"
  ON payments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política para subscriptions: usuários podem ver suas próprias assinaturas
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON subscriptions;
CREATE POLICY "Users can view their own subscriptions"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Política para subscriptions: usuários podem inserir suas próprias assinaturas
DROP POLICY IF EXISTS "Users can insert their own subscriptions" ON subscriptions;
CREATE POLICY "Users can insert their own subscriptions"
  ON subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política para subscriptions: usuários podem atualizar suas próprias assinaturas
DROP POLICY IF EXISTS "Users can update their own subscriptions" ON subscriptions;
CREATE POLICY "Users can update their own subscriptions"
  ON subscriptions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

### 5. ✅ Verificar Estrutura das Tabelas

Execute este SQL para verificar se todos os campos existem:

```sql
-- Verificar estrutura da tabela payments
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'payments'
ORDER BY ordinal_position;

-- Verificar estrutura da tabela subscriptions
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'subscriptions'
ORDER BY ordinal_position;
```

### 6. ✅ Criar Índices (Opcional, mas Recomendado)

Os índices já devem estar criados pela migration, mas você pode verificar:

```sql
-- Verificar índices
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('payments', 'subscriptions');
```

## 🔍 Verificação Final

Execute este SQL para verificar se tudo está configurado:

```sql
-- Verificar se tudo está OK
SELECT 
  'payments' as tabela,
  COUNT(*) as total_registros,
  COUNT(DISTINCT user_id) as usuarios_com_pagamento
FROM payments
UNION ALL
SELECT 
  'subscriptions' as tabela,
  COUNT(*) as total_registros,
  COUNT(DISTINCT user_id) as usuarios_com_assinatura
FROM subscriptions
UNION ALL
SELECT 
  'plans' as tabela,
  COUNT(*) as total_registros,
  COUNT(*) as planos_ativos
FROM plans
WHERE is_active = true;
```

## 📝 Notas Importantes

1. **Service Role Key**: A API de pagamento usa `createAdminClient()` que requer `SUPABASE_SERVICE_ROLE_KEY` para bypassar RLS. Certifique-se de que esta variável está configurada no Vercel.

2. **Campos Opcionais**: Se a tabela `payments` não tiver `plan_id` como obrigatório, a API funcionará mesmo sem ele (usa `null`).

3. **Status de Pagamento**: O sistema usa `status = 'confirmed'` para pagamentos confirmados. Certifique-se de que este valor está sendo usado corretamente.

4. **Data de Expiração**: A data de expiração da assinatura é calculada como `trial_ends_at` (mesmo que não seja trial). O sistema verifica se `trial_ends_at > NOW()` para determinar se a assinatura está ativa.

## 🆘 Problemas Comuns

### Erro: "column does not exist"
- **Solução**: Execute a migration `058_update_payments_for_mpesa_emola.sql`

### Erro: "permission denied for table"
- **Solução**: Verifique se as políticas RLS estão configuradas corretamente ou se está usando `SUPABASE_SERVICE_ROLE_KEY` na API

### Erro: "foreign key constraint"
- **Solução**: Certifique-se de que os planos existem na tabela `plans` antes de criar pagamentos

## ✅ Após Configuração

Após executar todas as configurações:

1. ✅ Teste criar um pagamento via checkout
2. ✅ Verifique se a subscription foi criada
3. ✅ Verifique se o pagamento foi registrado
4. ✅ Teste o bloqueio de acesso sem pagamento
5. ✅ Teste o acesso após pagamento confirmado

## 📞 Suporte

Se tiver problemas, verifique:
- Logs do Supabase: Dashboard → Logs
- Logs da API: Console do navegador (F12)
- Estrutura das tabelas: SQL Editor → Verificar colunas






