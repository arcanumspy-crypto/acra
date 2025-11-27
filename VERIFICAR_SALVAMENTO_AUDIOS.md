# ✅ Verificação: Onde os Áudios Gerados São Salvos

## 📍 Locais de Salvamento

Os áudios gerados são salvos em **2 lugares**:

### 1. Supabase Storage (Arquivo Físico)

**Caminho:** `voice-generations/{user_id}/{generation_id}.{format}`

**Exemplo:**
```
voice-generations/
  └── 09f7038f-16c2-4a67-b1be-c1aa97ed7666/
      └── a43e6a01-a557-449f-a9de-b59f08e9ff38.mp3
```

**Código:** `src/app/api/voices/generate-tts/route.ts` (linhas 533-568)

```typescript
const fileName = `voice-generations/${user.id}/${generationId}.${format || 'mp3'}`

// Upload para Supabase Storage
const { data: uploadData, error: uploadError } = await adminClient.storage
  .from(bucketName)
  .upload(fileName, audioBuffer, {
    contentType: `audio/${format || 'mp3'}`,
    upsert: false,
  })
```

**Fallback:** Se o upload falhar, o áudio é retornado como base64 (data URL).

---

### 2. Banco de Dados (Histórico/Metadados)

**Tabela:** `voice_audio_generations`

**Campos salvos:**
- `id` - UUID único
- `user_id` - ID do usuário que gerou
- `voice_clone_id` - ID da voz clonada usada
- `text` - Texto que foi convertido em áudio
- `text_hash` - Hash do texto (para cache)
- `audio_url` - URL do áudio no Storage (ou base64)
- `created_at` - Data/hora da geração

**Código:** `src/app/api/voices/generate-tts/route.ts` (linhas 570-595)

```typescript
const { data: savedGeneration, error: insertError } = await adminClient
  .from('voice_audio_generations')
  .insert({
    user_id: user.id,
    voice_clone_id: voiceClone.id,
    text: text,
    text_hash: textHash,
    audio_url: audioUrl,
  })
  .select()
  .single()
```

---

## ✅ Verificação: Está Funcionando?

### Como Verificar:

#### 1. Verificar no Supabase Storage

1. Acesse o Supabase Dashboard
2. Vá em **Storage** → **voice-clones** (ou o bucket configurado)
3. Procure pela pasta `voice-generations/{seu_user_id}/`
4. Você deve ver os arquivos de áudio gerados

#### 2. Verificar no Banco de Dados

Execute no SQL Editor do Supabase:

```sql
-- Ver todas as gerações do seu usuário
SELECT 
  id,
  voice_clone_id,
  text,
  audio_url,
  created_at
FROM voice_audio_generations
WHERE user_id = 'SEU_USER_ID_AQUI'
ORDER BY created_at DESC
LIMIT 10;
```

#### 3. Verificar nos Logs do Servidor

Quando gerar um áudio, você deve ver nos logs:

```
✅ Áudio gerado salvo no Storage: https://...
✅ Geração salva no histórico: {generation_id}
```

---

## ⚠️ Possíveis Problemas

### Problema 1: Erro ao Salvar no Storage

**Sintoma:** Log mostra "Erro ao fazer upload do áudio gerado"

**Solução:**
- Verificar se o bucket `voice-clones` existe
- Verificar permissões do `SUPABASE_SERVICE_ROLE_KEY`
- O sistema usa fallback para base64 (não bloqueia)

### Problema 2: Erro ao Salvar no Banco

**Sintoma:** Log mostra "⚠️ Erro ao salvar geração no histórico"

**Solução:**
- Verificar se a tabela `voice_audio_generations` existe
- Verificar RLS policies (deve permitir insert para o usuário)
- O sistema continua mesmo com erro (não bloqueia resposta)

### Problema 3: Áudio Não Aparece no Histórico

**Sintoma:** Áudio é gerado mas não aparece na página de histórico

**Solução:**
- Verificar se o endpoint `/api/voices/generations` está funcionando
- Verificar se a página `/voices/history` está carregando os dados
- Verificar RLS policies (deve permitir SELECT para o usuário)

---

## 🔍 Teste Rápido

### Via API:

```bash
# Gerar um áudio
curl -X POST http://localhost:3000/api/voices/generate-tts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{
    "voiceId": "uuid-da-voz",
    "text": "Teste de salvamento"
  }'
```

### Verificar Resposta:

A resposta deve incluir:
```json
{
  "success": true,
  "audioUrl": "https://...supabase.co/storage/.../audio.mp3",
  "cached": false,
  "format": "mp3"
}
```

---

## 📝 Resumo

✅ **Sim, os áudios estão sendo salvos corretamente em 2 lugares:**

1. **Supabase Storage** - Arquivo físico do áudio
2. **Banco de Dados** - Histórico com metadados (user_id, voice_clone_id, text, audio_url)

✅ **Tratamento de Erros:**
- Se Storage falhar → usa base64 (fallback)
- Se Banco falhar → apenas loga erro (não bloqueia)

✅ **Cache:**
- Sistema verifica se já existe geração com mesmo `text_hash` antes de gerar novamente

---

## 🆘 Se Não Estiver Salvando

1. Verificar logs do servidor para erros
2. Verificar se o bucket existe no Supabase
3. Verificar se a tabela `voice_audio_generations` existe
4. Verificar RLS policies no Supabase

