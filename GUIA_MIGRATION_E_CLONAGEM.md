# 🚀 Guia: Migration SQL + Clonagem Instantânea

## ⚠️ Problema

O erro ocorreu porque:
1. A coluna `audio_urls` não existe na tabela `voice_clones` (precisa executar migration)
2. A REST API da Fish Audio **não suporta criar modelos persistentes** (só o Python SDK)

---

## ✅ Solução: 2 Passos

### **PASSO 1: Executar Migration SQL**

1. **Acesse o Supabase Dashboard:**
   - Vá para https://app.supabase.com
   - Selecione seu projeto
   - Clique em **SQL Editor** (menu lateral)

2. **Execute esta migration:**

```sql
-- Adicionar coluna audio_urls à tabela voice_clones
ALTER TABLE voice_clones
ADD COLUMN IF NOT EXISTS audio_urls JSONB;

-- Comentário explicativo
COMMENT ON COLUMN voice_clones.audio_urls IS 'Array JSON com todas as URLs dos áudios de referência (múltiplos áudios para melhor treinamento)';
```

3. **Clique em "Run"** (ou `Ctrl+Enter`)

4. **Verifique se funcionou:**

```sql
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

### **PASSO 2: Entender Clonagem Instantânea**

**A REST API da Fish Audio NÃO tem endpoint para criar modelos persistentes.**

O Python SDK tem `client.voices.create()`, mas isso **só funciona no SDK Python**, não na REST API.

**Solução:** Usar **clonagem instantânea (on-the-fly)**:

- Os áudios são salvos no Supabase Storage
- Quando gerar TTS, os áudios são usados como `reference_audio` diretamente
- Funciona perfeitamente, mas não cria um modelo persistente na Fish API

---

## 🔍 Como Funciona Agora

### **1. Criar Voz (Clonagem Instantânea)**

```typescript
// O sistema agora:
// 1. Salva os áudios no Supabase Storage
// 2. Cria um voice_id local (UUID)
// 3. Salva as URLs dos áudios em audio_urls (JSONB)
// 4. Usa clonagem instantânea quando gerar TTS
```

### **2. Gerar TTS (Usando Áudios Salvos)**

```typescript
// Quando você gerar TTS:
// 1. Sistema busca os áudios salvos (audio_urls)
// 2. Baixa os áudios do Supabase Storage
// 3. Usa como reference_audio no TTS (clonagem instantânea)
// 4. Gera o áudio com a voz clonada
```

---

## 📋 Comparação: Python SDK vs REST API

### **Python SDK (client.voices.create())**
```python
# ✅ Funciona - cria modelo persistente
voice = client.voices.create(
    title="Minha Voz",
    voices=[audio1, audio2],
    texts=["transcript1", "transcript2"]
)
# Retorna: voice.id (modelo persistente)
```

### **REST API (não suporta)**
```typescript
// ❌ NÃO FUNCIONA - endpoints não existem
POST /v1/voices  // 404 Not Found
POST /v1/models  // 404 Not Found
```

### **Nossa Solução (Clonagem Instantânea)**
```typescript
// ✅ FUNCIONA - clonagem instantânea
// Salva áudios localmente
// Usa reference_audio no TTS
// Funciona perfeitamente!
```

---

## 🎯 Vantagens da Clonagem Instantânea

1. ✅ **Funciona imediatamente** (não precisa criar modelo)
2. ✅ **Múltiplos áudios** (usa todos os áudios salvos)
3. ✅ **Controle total** (você gerencia os áudios)
4. ✅ **Sem dependência** da Fish API para modelos

---

## ⚠️ Desvantagens

1. ❌ **Não cria modelo persistente** na Fish API
2. ❌ **Precisa baixar áudios** a cada geração (mas é rápido)
3. ❌ **Não pode compartilhar modelo** com outros usuários

---

## 🚀 Após Executar a Migration

1. **Tente criar uma voz novamente**
2. **Deve funcionar sem erros**
3. **Os áudios serão salvos e usados para clonagem instantânea**

---

## 📝 Arquivo da Migration

O arquivo completo está em:
```
supabase/migrations/005_add_audio_urls_to_voice_clones.sql
```

---

**Execute a migration e teste novamente!** ✅

