# 🔍 Debug: Erro ao Salvar Voz

## ✅ Confirmação

A coluna `audio_urls` **existe** na tabela `voice_clones` (tipo JSONB).

---

## 🔍 Possíveis Causas do Erro

### 1. **RLS (Row Level Security)**

O `adminClient` usa `SUPABASE_SERVICE_ROLE_KEY` que deveria bypassar RLS, mas pode estar com problema.

**Verificar:**
- `SUPABASE_SERVICE_ROLE_KEY` está configurada no `.env.local`?
- A chave está correta?

### 2. **Formato dos Dados**

O `audio_urls` precisa ser um array JSON válido.

**Verificar nos logs:**
- O formato de `insertData.audio_urls` está correto?
- É um array de strings?

### 3. **Outros Erros**

Pode ser:
- Campo obrigatório faltando
- Tipo de dado incorreto
- Problema de conexão

---

## 📋 Logs Detalhados Adicionados

O código agora mostra logs muito mais detalhados:

```
💾 Tentando salvar voz no banco de dados...
   - User ID: ...
   - Voice ID: ...
   - Audio URLs válidas: ...
   - InsertData completo: {...}
```

Se der erro, você verá:
```
❌ Erro ao salvar com audio_urls:
   Mensagem: ...
   Código: ...
   Detalhes: ...
```

---

## 🚀 Teste Novamente

1. **Recarregue a página** (F5)
2. **Tente criar uma voz**
3. **Verifique os logs no console do servidor**
4. **Copie o erro completo** e me envie

---

## 🔧 Se Ainda Der Erro

Execute esta query no Supabase para verificar a estrutura:

```sql
-- Ver estrutura completa da tabela
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'voice_clones'
ORDER BY ordinal_position;
```

---

**O código está melhorado com logs detalhados. Teste e me envie os logs do erro!** 🔍

