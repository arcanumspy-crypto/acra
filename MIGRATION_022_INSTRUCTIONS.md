# 🔧 Instruções - Migração 022: Corrigir payment_id

## ❌ Erro Atual

```
Error: Could not choose the best candidate function between: 
public.add_credits(..., p_payment_id => text, ...), 
public.add_credits(..., p_payment_id => uuid, ...)
```

Este erro ocorre porque existem **duas versões** da função `add_credits` no banco de dados:
- Uma com `p_payment_id` como `TEXT`
- Outra com `p_payment_id` como `UUID`

O PostgreSQL não consegue escolher qual usar quando você chama a função.

## ✅ Solução

Execute a migração **022_fix_payment_id_and_demo_mode.sql** no Supabase:

### Passo 1: Acessar SQL Editor

1. Acesse: https://app.supabase.com
2. Selecione seu projeto
3. Vá em **SQL Editor** (menu lateral)

### Passo 2: Executar Migração

1. Clique em **New Query**
2. Abra o arquivo: `supabase/migrations/022_fix_payment_id_and_demo_mode.sql`
3. Copie **TODO** o conteúdo do arquivo
4. Cole no SQL Editor
5. Clique em **Run** (ou pressione `Ctrl+Enter`)

### Passo 3: Verificar Sucesso

Você deve ver uma mensagem de sucesso. A migração irá:

✅ Remover todas as versões antigas da função `add_credits`  
✅ Alterar a coluna `payment_id` de `UUID` para `TEXT`  
✅ Criar uma única versão da função com `payment_id` como `TEXT`

### Passo 4: Testar

Após executar a migração:

1. Recarregue a página de créditos no navegador
2. Tente comprar um pacote de créditos
3. O erro não deve mais aparecer

## 📝 O que a migração faz?

1. **Remove funções duplicadas**: Elimina todas as versões antigas de `add_credits`
2. **Altera tipo da coluna**: Converte `payment_id` de `UUID` para `TEXT` (permite IDs demo como `"demo_payment_123"`)
3. **Cria função única**: Cria uma única versão da função com `payment_id` como `TEXT`

## ⚠️ Importante

- A migração é **segura** e não perde dados
- Valores UUID existentes serão convertidos automaticamente para TEXT
- A função continua funcionando normalmente após a migração

## 🆘 Ainda com problemas?

Se o erro persistir após executar a migração:

1. Verifique se a migração foi executada com sucesso
2. Verifique se não há erros no SQL Editor
3. Tente limpar o cache do navegador (Ctrl+Shift+R)
4. Verifique os logs do servidor Next.js para mais detalhes

