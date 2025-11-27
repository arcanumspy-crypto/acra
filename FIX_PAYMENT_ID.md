# 🔧 Correção do Erro de UUID no payment_id

## Problema
O erro `invalid input syntax for type uuid: "demo_payment_1764164273581"` ocorre porque o campo `payment_id` na tabela `credit_transactions` está definido como UUID, mas estamos enviando strings no modo demo.

## Solução

Execute a migração SQL no Supabase:

1. Acesse o **SQL Editor** no Supabase Dashboard
2. Abra o arquivo `supabase/migrations/022_fix_payment_id_and_demo_mode.sql`
3. Copie todo o conteúdo do arquivo
4. Cole no SQL Editor do Supabase
5. Execute o script

### Alternativa: Executar diretamente

Você também pode executar este comando diretamente no SQL Editor:

```sql
-- Alterar coluna payment_id de UUID para TEXT
ALTER TABLE credit_transactions 
  ALTER COLUMN payment_id TYPE TEXT USING payment_id::TEXT;

-- Atualizar função add_credits
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
BEGIN
  SELECT balance INTO v_balance_before
  FROM user_credits
  WHERE user_id = p_user_id;
  
  IF v_balance_before IS NULL THEN
    INSERT INTO user_credits (user_id, balance, total_loaded)
    VALUES (p_user_id, 0, 0)
    ON CONFLICT (user_id) DO NOTHING;
    v_balance_before := 0;
  END IF;
  
  v_balance_after := v_balance_before + p_amount;
  
  UPDATE user_credits
  SET 
    balance = v_balance_after,
    total_loaded = total_loaded + p_amount,
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
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
```

## Verificação

Após executar, verifique se funcionou:

```sql
-- Verificar o tipo da coluna
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'credit_transactions' 
AND column_name = 'payment_id';
```

O resultado deve mostrar `data_type = 'text'` ou `data_type = 'character varying'`.

## Após a correção

Após executar a migração, o sistema permitirá:
- ✅ IDs de pagamento em modo demo (ex: `demo_payment_1764164273581`)
- ✅ IDs de pagamento UUID (quando integrar gateway real)
- ✅ NULL (quando não houver payment_id)


