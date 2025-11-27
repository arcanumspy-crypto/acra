# 🔍 Debug: Créditos não estão sendo adicionados

## Problema
O frontend mostra que os créditos foram adicionados, mas o backend não persiste. Quando recarrega, o saldo volta a zero.

## Soluções

### 1. Execute a migração SQL (CRÍTICO)

Execute o arquivo `supabase/migrations/022_fix_payment_id_and_demo_mode.sql` no SQL Editor do Supabase.

Isso vai:
- Alterar `payment_id` de UUID para TEXT
- Atualizar a função `add_credits` para aceitar TEXT
- Adicionar validações para garantir que os dados sejam persistidos

### 2. Verifique os logs do servidor

Após tentar adicionar créditos, verifique o console do servidor (terminal onde está rodando `npm run dev`). Você deve ver:

```
🔄 Chamando add_credits RPC: { userId, totalCredits, ... }
✅ Créditos adicionados com sucesso: { transactionId, totalCredits }
📊 Saldo após adicionar créditos: { balance, total_loaded }
```

Se houver erros, eles aparecerão com `❌` ou `⚠️`.

### 3. Verifique no banco de dados

Execute no SQL Editor do Supabase:

```sql
-- Verificar se a função foi atualizada
SELECT 
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'add_credits'
AND n.nspname = 'public';

-- Verificar transações recentes
SELECT 
  id,
  user_id,
  type,
  amount,
  balance_before,
  balance_after,
  category,
  created_at
FROM credit_transactions
ORDER BY created_at DESC
LIMIT 10;

-- Verificar saldo de um usuário específico
SELECT 
  user_id,
  balance,
  total_loaded,
  total_consumed,
  updated_at
FROM user_credits
WHERE user_id = 'SEU_USER_ID_AQUI';
```

### 4. Verifique permissões RLS

A função `add_credits` usa `SECURITY DEFINER`, então deve ter permissões. Verifique:

```sql
-- Verificar políticas RLS
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename IN ('user_credits', 'credit_transactions');
```

### 5. Teste direto no banco

Teste a função diretamente:

```sql
-- Substitua 'SEU_USER_ID' pelo ID real do usuário
SELECT add_credits(
  'SEU_USER_ID'::UUID,
  100,  -- quantidade de créditos
  'purchase',
  'Teste manual',
  NULL,  -- package_id
  'demo_payment_test'::TEXT,  -- payment_id
  '{"test": true}'::JSONB
);

-- Verificar se funcionou
SELECT balance, total_loaded 
FROM user_credits 
WHERE user_id = 'SEU_USER_ID';
```

### 6. Verifique variáveis de ambiente

Certifique-se de que `SUPABASE_SERVICE_ROLE_KEY` está configurado no `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
```

**IMPORTANTE**: Reinicie o servidor após alterar variáveis de ambiente!

## Possíveis causas

1. **Migração não executada**: A função ainda espera UUID em vez de TEXT
2. **RLS bloqueando**: Políticas de segurança podem estar bloqueando
3. **Transação não commitada**: A função pode estar falhando silenciosamente
4. **Service Role Key ausente**: O adminClient não consegue fazer operações

## Próximos passos

1. Execute a migração SQL
2. Verifique os logs do servidor
3. Teste a função diretamente no banco
4. Se ainda não funcionar, compartilhe os logs do servidor


