-- ============================================
-- CONFIGURAÇÃO COMPLETA DO SUPABASE PARA PAGAMENTO
-- Execute este arquivo no SQL Editor do Supabase
-- ============================================

-- 1. Executar migration 058 (adicionar campos)
-- ============================================
-- Adicionar colunas na tabela payments
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'amount'
  ) THEN
    ALTER TABLE payments ADD COLUMN amount DECIMAL(10,2);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'method'
  ) THEN
    ALTER TABLE payments ADD COLUMN method TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'transaction_id'
  ) THEN
    ALTER TABLE payments ADD COLUMN transaction_id TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'payment_type'
  ) THEN
    ALTER TABLE payments ADD COLUMN payment_type TEXT DEFAULT 'subscription';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'notes'
  ) THEN
    ALTER TABLE payments ADD COLUMN notes TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'payment_date'
  ) THEN
    ALTER TABLE payments ADD COLUMN payment_date TIMESTAMPTZ;
  END IF;
END $$;

-- Adicionar colunas na tabela subscriptions
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'subscriptions' AND column_name = 'plan_name'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN plan_name TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'subscriptions' AND column_name = 'price'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN price DECIMAL(10,2);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'subscriptions' AND column_name = 'is_trial'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN is_trial BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'subscriptions' AND column_name = 'trial_ends_at'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN trial_ends_at TIMESTAMPTZ;
  END IF;
END $$;

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_payments_user_id_status ON payments(user_id, status);
CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON payments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payments_method ON payments(method);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id_status ON subscriptions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_trial_ends_at ON subscriptions(trial_ends_at);

-- 2. Criar Planos
-- ============================================
INSERT INTO plans (name, slug, description, price_monthly_cents, is_active)
VALUES 
  ('Mensal', 'mensal', 'Plano mensal - 800 MT', 80000, true),
  ('Trimestral', 'trimestral', 'Plano trimestral - 2160 MT (10% desconto)', 72000, true),
  ('Anual', 'anual', 'Plano anual - 7680 MT (20% desconto)', 64000, true)
ON CONFLICT (slug) DO UPDATE
SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_monthly_cents = EXCLUDED.price_monthly_cents,
  is_active = EXCLUDED.is_active;

-- 3. Configurar Políticas RLS
-- ============================================
-- Habilitar RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Políticas para payments
DROP POLICY IF EXISTS "Users can view their own payments" ON payments;
CREATE POLICY "Users can view their own payments"
  ON payments FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own payments" ON payments;
CREATE POLICY "Users can insert their own payments"
  ON payments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Políticas para subscriptions (já devem existir, mas garantindo)
DROP POLICY IF EXISTS "Users can view own subscription" ON subscriptions;
CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own subscription" ON subscriptions;
CREATE POLICY "Users can insert own subscription"
  ON subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own subscription" ON subscriptions;
CREATE POLICY "Users can update own subscription"
  ON subscriptions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4. Verificação Final
-- ============================================
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

-- Verificar estrutura
SELECT 
  'payments' as tabela,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'payments'
AND column_name IN ('amount', 'method', 'transaction_id', 'payment_type', 'notes', 'payment_date')
ORDER BY column_name;

SELECT 
  'subscriptions' as tabela,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'subscriptions'
AND column_name IN ('plan_name', 'price', 'is_trial', 'trial_ends_at')
ORDER BY column_name;

-- ============================================
-- ✅ CONFIGURAÇÃO CONCLUÍDA!
-- ============================================
-- Agora você pode usar o sistema de pagamento.
-- Certifique-se de que SUPABASE_SERVICE_ROLE_KEY está configurado no Vercel.

