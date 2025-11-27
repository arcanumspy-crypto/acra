-- ============================================
-- Tabela de Atividade Recente do Usuário
-- ============================================
CREATE TABLE IF NOT EXISTS user_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL, -- 'favorite_added', 'offer_viewed', 'offer_saved', 'search_performed', etc.
  activity_data JSONB, -- Dados adicionais da atividade (título da oferta, query de busca, etc.)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_created_at ON user_activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activities_type ON user_activities(activity_type);

-- ============================================
-- Tabela de Pagamentos
-- ============================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE RESTRICT,
  amount_cents INTEGER NOT NULL, -- Valor em centavos
  currency TEXT NOT NULL DEFAULT 'BRL',
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'refunded'
  payment_method TEXT, -- 'credit_card', 'pix', 'bank_transfer', etc.
  invoice_number TEXT UNIQUE, -- Número da nota fiscal
  invoice_url TEXT, -- URL para download da nota fiscal
  metadata JSONB, -- Dados adicionais do pagamento
  paid_at TIMESTAMPTZ, -- Data de pagamento confirmado
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_subscription_id ON payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);

-- Trigger para updated_at na tabela payments
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Função para registrar atividade do usuário
-- ============================================
CREATE OR REPLACE FUNCTION register_user_activity(
  p_user_id UUID,
  p_activity_type TEXT,
  p_activity_data JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  activity_id UUID;
BEGIN
  INSERT INTO user_activities (user_id, activity_type, activity_data)
  VALUES (p_user_id, p_activity_type, p_activity_data)
  RETURNING id INTO activity_id;
  
  -- Manter apenas as últimas 100 atividades por usuário (opcional, para performance)
  DELETE FROM user_activities
  WHERE user_id = p_user_id
    AND id NOT IN (
      SELECT id FROM user_activities
      WHERE user_id = p_user_id
      ORDER BY created_at DESC
      LIMIT 100
    );
  
  RETURN activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- RLS Policies para user_activities
-- ============================================
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own activities"
  ON user_activities FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own activities"
  ON user_activities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- RLS Policies para payments
-- ============================================
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own payments"
  ON payments FOR SELECT
  USING (auth.uid() = user_id);

-- Admins podem ver todos os pagamentos
CREATE POLICY "Admins can view all payments"
  ON payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

