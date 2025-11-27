# 🔄 Fish Audio: Python SDK vs REST API

## 📚 Diferenças entre Python SDK e REST API

Baseado na [documentação oficial](https://docs.fish.audio/developer-guide/sdk-guide/python/voice-cloning), há diferenças importantes entre o Python SDK e a REST API.

---

## 🐍 Python SDK

### Criar Modelo Persistente

```python
from fishaudio import FishAudio

client = FishAudio()

voice = client.voices.create(
    title="My Custom Voice",
    voices=[audio1_bytes, audio2_bytes],  # Array de bytes
    texts=["transcript1", "transcript2"],  # Array de transcrições
    description="A custom voice",
    tags=["custom", "english"],
    visibility="private",
    enhance_audio_quality=True
)

print(f"Created voice: {voice.id}")  # Retorna ID (32 hex chars)
```

**Endpoint:** `/v1/voices` (provavelmente)

**Formato:**
```json
{
  "title": "My Custom Voice",
  "voices": ["base64_audio1", "base64_audio2"],
  "texts": ["transcript1", "transcript2"],
  "description": "...",
  "visibility": "private",
  "enhance_audio_quality": true
}
```

---

### Clonagem Instantânea (Múltiplas Referências)

```python
from fishaudio.types import ReferenceAudio

references = [
    ReferenceAudio(audio=audio1_bytes, text="transcript1"),
    ReferenceAudio(audio=audio2_bytes, text="transcript2"),
    ReferenceAudio(audio=audio3_bytes, text="transcript3")
]

audio = client.tts.convert(
    text="This voice is trained on multiple samples",
    references=references  # ✅ Array de ReferenceAudio
)
```

**Suporta múltiplas referências!** ✅

---

## 🌐 REST API

### Criar Modelo Persistente

**Endpoint:** `/v1/voices` ou `/v1/models` (verificar qual funciona)

**Formato 1 (Python SDK style):**
```json
{
  "title": "My Custom Voice",
  "voices": ["base64_audio1", "base64_audio2"],
  "texts": ["transcript1", "transcript2"],
  "description": "...",
  "visibility": "private"
}
```

**Formato 2 (Alternativo):**
```json
{
  "name": "My Custom Voice",
  "audios": [
    {
      "filename": "audio1.wav",
      "content_base64": "...",
      "transcript": "transcript1"
    }
  ]
}
```

---

### Clonagem Instantânea

**Endpoint:** `/v1/tts`

**Formato (com reference_id):**
```json
{
  "text": "Hello",
  "reference_id": "8ef4a238714b45718ce04243307c57a7",
  "temperature": 0.9,
  "top_p": 0.9,
  "normalize": true,
  "format": "mp3",
  "latency": "normal"
}
```

**Formato (com reference_audio):**
```json
{
  "text": "Hello",
  "reference_audio": "base64...",
  "reference_text": "transcript",
  "temperature": 0.9,
  "top_p": 0.9,
  "normalize": true,
  "format": "mp3"
}
```

**⚠️ REST API pode não suportar múltiplas referências em `reference_audio`**
- Python SDK: `references=[ReferenceAudio(...), ReferenceAudio(...)]` ✅
- REST API: `reference_audio="base64..."` (apenas um) ⚠️

---

## ✅ Nossa Implementação Atual

### 1. Criar Modelo

```typescript
// Tenta /v1/voices primeiro (formato Python SDK)
// Fallback para /v1/models se não funcionar
POST /v1/voices
{
  "title": "Voz Masculina",
  "voices": ["base64_audio1", "base64_audio2"],
  "texts": ["transcript1", "transcript2"],
  "description": "...",
  "visibility": "private",
  "enhance_audio_quality": true
}
```

### 2. Gerar TTS

**Com reference_id (modelo criado):**
```typescript
POST /v1/tts
Headers: { "model": "s1" }
Body: {
  "text": "Olá",
  "reference_id": "8ef4a238714b45718ce04243307c57a7",
  "temperature": 0.1,
  "normalize": true
}
```

**Com reference_audio (clonagem instantânea):**
```typescript
POST /v1/tts
Headers: { "model": "s1" }
Body: {
  "text": "Olá",
  "reference_audio": "base64...",
  "reference_text": "transcript",
  "temperature": 0.1,
  "normalize": true
}
```

---

## 🔄 Melhorias Implementadas

### 1. ✅ Suporte a Múltiplas Referências (Formato ReferenceAudio)

```typescript
interface ReferenceAudio {
  audio: Buffer | string
  text?: string
}

// Agora aceita:
generateTTS(voiceId, text, options, [
  { audio: buffer1, text: "transcript1" },
  { audio: buffer2, text: "transcript2" }
])
```

### 2. ✅ Tentar /v1/voices Primeiro

```typescript
// Tenta formato Python SDK primeiro
POST /v1/voices
{
  "title": "...",
  "voices": ["base64..."],
  "texts": ["transcript..."],
  "enhance_audio_quality": true
}

// Fallback para /v1/models se não funcionar
POST /v1/models
{
  "name": "...",
  "audios": [{ filename, content_base64, transcript }]
}
```

### 3. ✅ Suporte a Array de Transcrições

```typescript
// Agora aceita:
referenceText: string | string[]
```

---

## 📝 Próximos Passos

1. **Testar qual endpoint funciona:**
   - `/v1/voices` (formato Python SDK)
   - `/v1/models` (formato alternativo)

2. **Verificar suporte a múltiplas referências na REST API:**
   - Se suportar: implementar array de `reference_audio`
   - Se não: criar modelo persistente com todas as referências

3. **Melhorar tratamento de erros:**
   - Detectar qual formato a API aceita
   - Fallback automático entre formatos

---

## 🎯 Resultado

A implementação agora:
- ✅ Tenta `/v1/voices` primeiro (formato Python SDK)
- ✅ Fallback para `/v1/models` se necessário
- ✅ Suporta múltiplas referências (formato ReferenceAudio)
- ✅ Suporta array de transcrições
- ✅ Usa `enhance_audio_quality: true` por padrão

---

**Implementação alinhada com Python SDK!** 🎉

