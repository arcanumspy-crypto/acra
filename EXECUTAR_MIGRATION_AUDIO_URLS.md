# 🚀 Executar Migration: Adicionar audio_urls à voice_clones

## ⚠️ Problema

O erro ocorreu porque a coluna `audio_urls` não existe na tabela `voice_clones`. Esta migration adiciona essa coluna para suportar múltiplos áudios de referência.

---

## 📝 Passo a Passo

### 1. Acessar o Supabase SQL Editor

1. Acesse o [Supabase Dashboard](https://app.supabase.com)
2. Selecione seu projeto
3. Vá em **SQL Editor** (menu lateral esquerdo)
4. Clique em **New Query**

### 2. Copiar e Colar a Migration

Copie o conteúdo abaixo e cole no SQL Editor:

```sql
-- ============================================
-- Migration: Adicionar audio_urls à voice_clones
-- Data: 2024
-- Descrição: Adiciona coluna audio_urls (JSONB) para armazenar múltiplos áudios de referência
-- ============================================

-- Adicionar coluna audio_urls (JSONB) para armazenar array de URLs
ALTER TABLE voice_clones
ADD COLUMN IF NOT EXISTS audio_urls JSONB;

-- Comentário explicativo
COMMENT ON COLUMN voice_clones.audio_urls IS 'Array JSON com todas as URLs dos áudios de referência (múltiplos áudios para melhor treinamento)';
```

### 3. Executar a Migration

1. Clique no botão **Run** (ou pressione `Ctrl+Enter`)
2. Aguarde a confirmação: "Success. No rows returned"
3. Pronto! ✅

---

## ✅ Verificar se Funcionou

Execute esta query para verificar:

```sql
-- Verificar se a coluna foi adicionada
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'voice_clones' 
AND column_name = 'audio_urls';
```

**Resultado esperado:**
```
column_name  | data_type
-------------|----------
audio_urls   | jsonb
```

---

## 🔍 Verificar Estrutura Completa da Tabela

Para ver todas as colunas da tabela `voice_clones`:

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

## 🚨 Se Der Erro

### Erro: "relation voice_clones does not exist"

**Solução:** Execute primeiro a migration `004_voice_cloning.sql` que cria a tabela `voice_clones`.

### Erro: "column audio_urls already exists"

**Solução:** A coluna já existe! Pode ignorar o erro ou usar `DROP COLUMN` primeiro (não recomendado se houver dados).

---

## 📋 Migration Completa (005_add_audio_urls_to_voice_clones.sql)

O arquivo completo está em:
```
supabase/migrations/005_add_audio_urls_to_voice_clones.sql
```

---

**Após executar a migration, tente criar uma voz novamente!** ✅
