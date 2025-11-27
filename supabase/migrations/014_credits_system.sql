-- ============================================
-- SISTEMA DE CRÉDITOS
-- ============================================

-- Tabela para armazenar pacotes de créditos disponíveis para compra
CREATE TABLE IF NOT EXISTS credit_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, -- Nome do pacote (ex: "Pacote Básico", "Pacote Premium")
  credits INTEGER NOT NULL, -- Quantidade de créditos no pacote
  price_cents INTEGER NOT NULL, -- Preço em centavos (ex: 9999 = R$ 99,99)
  currency TEXT NOT NULL DEFAULT 'USD', -- Moeda (USD, BRL, MZN)
  bonus_credits INTEGER DEFAULT 0, -- Créditos bônus adicionais
  is_active BOOLEAN DEFAULT true,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para armazenar saldo de créditos dos usuários
CREATE TABLE IF NOT EXISTS user_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0, -- Saldo atual (pode ser negativo)
  total_loaded INTEGER NOT NULL DEFAULT 0, -- Total de créditos carregados historicamente
  total_consumed INTEGER NOT NULL DEFAULT 0, -- Total de créditos consumidos historicamente
  low_balance_threshold INTEGER DEFAULT 10, -- Limite para alerta de saldo baixo
  is_blocked BOOLEAN DEFAULT false, -- Bloqueado por dívida
  last_notification_at TIMESTAMP WITH TIME ZONE, -- Última vez que foi notificado sobre saldo baixo
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Tabela para histórico de todas as transações de créditos
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'credit' (carregamento) ou 'debit' (consumo)
  amount INTEGER NOT NULL, -- Quantidade de créditos (sempre positivo)
  balance_before INTEGER NOT NULL, -- Saldo antes da transação
  balance_after INTEGER NOT NULL, -- Saldo depois da transação
  category TEXT NOT NULL, -- 'purchase' (compra), 'offer_view' (visualização), 'copy_generation' (copy), 'audio_generation' (áudio), 'bonus' (bônus), 'refund' (reembolso)
  description TEXT, -- Descrição da transação
  metadata JSONB, -- Dados adicionais (ex: offer_id, character_count, audio_duration_minutes)
  package_id UUID REFERENCES credit_packages(id), -- ID do pacote (se for compra)
  payment_id UUID, -- ID do pagamento externo (se houver)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON user_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_type ON credit_transactions(type);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_category ON credit_transactions(category);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_created ON credit_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_type_category ON credit_transactions(type, category);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_credit_packages_updated_at
  BEFORE UPDATE ON credit_packages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_credits_updated_at
  BEFORE UPDATE ON user_credits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Função para criar registro de créditos quando usuário é criado
CREATE OR REPLACE FUNCTION create_user_credits()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_credits (user_id, balance, total_loaded, total_consumed)
  VALUES (NEW.id, 0, 0, 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar créditos quando usuário é criado
DROP TRIGGER IF EXISTS on_auth_user_created_credits ON auth.users;
CREATE TRIGGER on_auth_user_created_credits
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_credits();

-- Inserir pacotes de créditos padrão
INSERT INTO credit_packages (name, credits, price_cents, currency, bonus_credits, description, is_active) VALUES
  ('Pacote Básico', 100, 9900, 'USD', 0, '100 créditos - Ideal para começar', true),
  ('Pacote Popular', 500, 45000, 'USD', 50, '500 créditos + 50 bônus = 550 créditos', true),
  ('Pacote Premium', 1000, 85000, 'USD', 150, '1000 créditos + 150 bônus = 1150 créditos', true),
  ('Pacote Profissional', 5000, 400000, 'USD', 1000, '5000 créditos + 1000 bônus = 6000 créditos', true)
ON CONFLICT DO NOTHING;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Ativar RLS
ALTER TABLE credit_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- Policies para credit_packages (todos podem ver pacotes ativos)
CREATE POLICY "Pacotes ativos são públicos"
  ON credit_packages FOR SELECT
  USING (is_active = true);

-- Policies para user_credits (usuário vê apenas próprio, admin vê todos)
CREATE POLICY "Usuário vê próprio saldo"
  ON user_credits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuário atualiza próprio saldo"
  ON user_credits FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admin vê todos os créditos"
  ON user_credits FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin atualiza todos os créditos"
  ON user_credits FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policies para credit_transactions (usuário vê apenas próprias, admin vê todas)
CREATE POLICY "Usuário vê próprias transações"
  ON credit_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admin vê todas as transações"
  ON credit_transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy para inserir transações (apenas sistema/admin)
CREATE POLICY "Sistema pode inserir transações"
  ON credit_transactions FOR INSERT
  WITH CHECK (true); -- Será validado nas funções server-side

-- ============================================
-- FUNÇÕES ÚTEIS
-- ============================================

-- Função para obter saldo do usuário
CREATE OR REPLACE FUNCTION get_user_credit_balance(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_balance INTEGER;
BEGIN
  SELECT balance INTO v_balance
  FROM user_credits
  WHERE user_id = p_user_id;
  
  RETURN COALESCE(v_balance, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para adicionar créditos (carregamento)
CREATE OR REPLACE FUNCTION add_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_category TEXT,
  p_description TEXT DEFAULT NULL,
  p_package_id UUID DEFAULT NULL,
  p_payment_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_transaction_id UUID;
  v_balance_before INTEGER;
  v_balance_after INTEGER;
BEGIN
  -- Obter saldo atual
  SELECT balance INTO v_balance_before
  FROM user_credits
  WHERE user_id = p_user_id;
  
  IF v_balance_before IS NULL THEN
    -- Criar registro se não existir
    INSERT INTO user_credits (user_id, balance, total_loaded)
    VALUES (p_user_id, 0, 0)
    ON CONFLICT (user_id) DO NOTHING;
    
    v_balance_before := 0;
  END IF;
  
  v_balance_after := v_balance_before + p_amount;
  
  -- Atualizar saldo
  UPDATE user_credits
  SET 
    balance = v_balance_after,
    total_loaded = total_loaded + p_amount,
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Criar transação
  INSERT INTO credit_transactions (
    user_id, type, amount, balance_before, balance_after,
    category, description, metadata, package_id, payment_id
  ) VALUES (
    p_user_id, 'credit', p_amount, v_balance_before, v_balance_after,
    p_category, p_description, p_metadata, p_package_id, p_payment_id
  )
  RETURNING id INTO v_transaction_id;
  
  RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para debitar créditos (consumo)
CREATE OR REPLACE FUNCTION debit_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_category TEXT,
  p_description TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL,
  p_allow_negative BOOLEAN DEFAULT true -- Permite saldo negativo (dívida)
)
RETURNS UUID AS $$
DECLARE
  v_transaction_id UUID;
  v_balance_before INTEGER;
  v_balance_after INTEGER;
  v_balance INTEGER;
BEGIN
  -- Obter saldo atual
  SELECT balance INTO v_balance_before
  FROM user_credits
  WHERE user_id = p_user_id;
  
  IF v_balance_before IS NULL THEN
    -- Criar registro se não existir
    INSERT INTO user_credits (user_id, balance, total_consumed)
    VALUES (p_user_id, 0, 0)
    ON CONFLICT (user_id) DO NOTHING;
    
    v_balance_before := 0;
  END IF;
  
  -- Verificar se pode debitar (a menos que allow_negative seja true)
  IF NOT p_allow_negative AND v_balance_before < p_amount THEN
    RAISE EXCEPTION 'Saldo insuficiente. Disponível: %, Necessário: %', v_balance_before, p_amount;
  END IF;
  
  v_balance_after := v_balance_before - p_amount;
  
  -- Atualizar saldo
  UPDATE user_credits
  SET 
    balance = v_balance_after,
    total_consumed = total_consumed + p_amount,
    updated_at = NOW(),
    -- Bloquear se saldo negativo
    is_blocked = CASE WHEN v_balance_after < 0 THEN true ELSE is_blocked END
  WHERE user_id = p_user_id;
  
  -- Criar transação
  INSERT INTO credit_transactions (
    user_id, type, amount, balance_before, balance_after,
    category, description, metadata
  ) VALUES (
    p_user_id, 'debit', p_amount, v_balance_before, v_balance_after,
    p_category, p_description, p_metadata
  )
  RETURNING id INTO v_transaction_id;
  
  RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE credit_packages IS 'Pacotes de créditos disponíveis para compra';
COMMENT ON TABLE user_credits IS 'Saldo de créditos dos usuários';
COMMENT ON TABLE credit_transactions IS 'Histórico de todas as transações de créditos';

