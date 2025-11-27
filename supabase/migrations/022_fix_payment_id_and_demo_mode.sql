-- ============================================
-- CORRIGIR payment_id PARA TEXT (MODO DEMO)
-- Execute este arquivo no SQL Editor do Supabase
-- ============================================

-- PRIMEIRO: Remover TODAS as versões antigas da função add_credits
-- Isso resolve o erro de ambiguidade quando há múltiplas versões
DROP FUNCTION IF EXISTS public.add_credits(UUID, INTEGER, TEXT, TEXT, UUID, UUID, JSONB);
DROP FUNCTION IF EXISTS public.add_credits(UUID, INTEGER, TEXT, TEXT, UUID, TEXT, JSONB);
DROP FUNCTION IF EXISTS public.add_credits(UUID, INTEGER, TEXT);
DROP FUNCTION IF EXISTS public.add_credits(UUID, INTEGER, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.add_credits(UUID, INTEGER, TEXT, TEXT, UUID);
DROP FUNCTION IF EXISTS public.add_credits(UUID, INTEGER, TEXT, TEXT, UUID, UUID);
DROP FUNCTION IF EXISTS public.add_credits(UUID, INTEGER, TEXT, TEXT, UUID, TEXT);

-- Alterar o tipo da coluna payment_id de UUID para TEXT
-- O USING vai converter automaticamente os valores UUID existentes para TEXT
ALTER TABLE credit_transactions 
  ALTER COLUMN payment_id TYPE TEXT USING payment_id::TEXT;

-- Criar a função add_credits com payment_id como TEXT
-- Esta é a única versão que deve existir
CREATE OR REPLACE FUNCTION add_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_category TEXT,
  p_description TEXT DEFAULT NULL,
  p_package_id UUID DEFAULT NULL,
  p_payment_id TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_transaction_id UUID;
  v_balance_before INTEGER;
  v_balance_after INTEGER;
  v_user_credits_exists BOOLEAN;
BEGIN
  -- Verificar se registro de créditos existe
  SELECT EXISTS(SELECT 1 FROM user_credits WHERE user_id = p_user_id) INTO v_user_credits_exists;
  
  -- Obter saldo atual ou criar registro se não existir
  IF NOT v_user_credits_exists THEN
    -- Criar registro se não existir
    INSERT INTO user_credits (user_id, balance, total_loaded, total_consumed)
    VALUES (p_user_id, 0, 0, 0)
    ON CONFLICT (user_id) DO NOTHING;
    
    v_balance_before := 0;
  ELSE
    -- Obter saldo atual
    SELECT balance INTO v_balance_before
    FROM user_credits
    WHERE user_id = p_user_id;
    
    -- Garantir que não é NULL
    IF v_balance_before IS NULL THEN
      v_balance_before := 0;
    END IF;
  END IF;
  
  -- Calcular novo saldo
  v_balance_after := v_balance_before + p_amount;
  
  -- Atualizar saldo (garantir que o UPDATE realmente acontece)
  UPDATE user_credits
  SET 
    balance = v_balance_after,
    total_loaded = total_loaded + p_amount,
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Verificar se o UPDATE funcionou
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Erro ao atualizar saldo de créditos para usuário %', p_user_id;
  END IF;
  
  -- Criar transação
  INSERT INTO credit_transactions (
    user_id, type, amount, balance_before, balance_after,
    category, description, metadata, package_id, payment_id
  ) VALUES (
    p_user_id, 'credit', p_amount, v_balance_before, v_balance_after,
    p_category, p_description, p_metadata, p_package_id, p_payment_id
  )
  RETURNING id INTO v_transaction_id;
  
  -- Verificar se a transação foi criada
  IF v_transaction_id IS NULL THEN
    RAISE EXCEPTION 'Erro ao criar transação de créditos';
  END IF;
  
  RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
