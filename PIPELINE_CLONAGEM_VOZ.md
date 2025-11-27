# Pipeline Profissional de Clonagem de Voz

## 📋 Visão Geral

Este pipeline replica o processo profissional do **Fish AI** para clonagem de voz:

1. **Processa o áudio** (pré-processamento)
2. **Extrai o embedding da voz** (características acústicas)
3. **Ajusta sotaque e timbre** (via embeddings combinados)
4. **Usa servidor treinado** (Fish API ou modelo local)
5. **Aplica correções internas** (validação)
6. **Roda no modelo mais atualizado** (s1 ou speech-1.5)
7. **Faz alinhamento de espectrograma** (opcional)

---

## 🚀 Instalação

### 1. Dependências Python (Worker)

**⚠️ IMPORTANTE:** Python precisa estar instalado primeiro!

**Verificar se Python está instalado:**
```powershell
python --version
# ou
py --version
```

**Se não estiver instalado, veja:** `INSTALACAO_PYTHON_WINDOWS.md`

**Instalar dependências:**
```powershell
cd workers
python -m pip install -r requirements.txt
```

**Ou instalar manualmente:**

```powershell
python -m pip install librosa soundfile noisereduce resemblyzer numpy scipy requests python-dotenv
```

**Nota no Windows:** Use `python -m pip` ao invés de apenas `pip` se `pip` não for reconhecido.

**Opcional (para ECAPA-TDNN):**

```bash
pip install speechbrain torch torchaudio
```

### 2. Dependências Node.js (Backend)

```bash
npm install formidable node-fetch@2 axios dotenv
```

### 3. Variáveis de Ambiente

Crie arquivo `.env.local`:

```env
# Fish API
FISH_AUDIO_API_KEY=your_fish_api_key
FISH_AUDIO_API_URL=https://api.fish.audio

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Storage
STORAGE_BASE_URL=https://your-project.supabase.co

# Queue (opcional - para produção)
REDIS_URL=redis://localhost:6379
DATABASE_URL=postgres://user:pass@localhost:5432/db
```

---

## 📁 Estrutura de Arquivos

```
ej-swipefile/
├── workers/
│   ├── requirements.txt              # Dependências Python
│   ├── preprocess_and_embed.py      # Pré-processamento + embedding
│   ├── build_voice.py                # Worker pipeline completo
│   ├── validate_generation.py        # Validação de similaridade
│   ├── audio_preprocessor.py         # Pré-processamento avançado
│   ├── voice_embedding_extractor.py  # Extração de embeddings
│   └── voice_pipeline.py             # Pipeline completo
│
├── src/
│   ├── app/api/voices/
│   │   ├── upload/route.ts           # Upload de áudios
│   │   ├── create-model/route.ts     # Criar modelo
│   │   └── generate/route.ts        # Gerar áudio
│   │
│   └── lib/
│       ├── storage.ts                # Helpers de storage
│       ├── queue.ts                 # Helpers de queue
│       ├── db-voice.ts              # Helpers de banco
│       └── voice-validation-advanced.ts  # Validação avançada
│
└── PIPELINE_CLONAGEM_VOZ.md         # Esta documentação
```

---

## 🔄 Fluxo do Pipeline

### Etapa 1: Upload de Áudios

**Endpoint:** `POST /api/voices/upload`

```typescript
const formData = new FormData()
formData.append('name', 'Minha Voz')
formData.append('audioCount', '2')
formData.append('audio0', audioFile1)
formData.append('audio1', audioFile2)
formData.append('transcripts', JSON.stringify(['Olá', 'Como vai?']))

const response = await fetch('/api/voices/upload', {
  method: 'POST',
  body: formData
})
```

**O que acontece:**
1. Valida autenticação
2. Salva áudios no Supabase Storage
3. Cria job na fila para processamento
4. Retorna `jobId` e URLs dos áudios

---

### Etapa 2: Processamento (Worker Python)

**Worker:** `workers/build_voice.py`

```bash
# Executar worker manualmente (ou via queue)
python workers/build_voice.py
```

**O que acontece:**
1. Baixa áudios do storage
2. Pré-processa cada áudio:
   - Conversão para mono
   - Resample para 24kHz
   - Redução de ruído
   - Normalização RMS
   - Trim de silêncio
3. Extrai embeddings usando Resemblyzer
4. Combina embeddings (ajuste de sotaque/timbre)
5. Cria modelo na Fish API (ou local)
6. Salva `model_id` no banco

---

### Etapa 3: Criação de Modelo

**Endpoint:** `POST /api/voices/create-model`

```typescript
const response = await fetch('/api/voices/create-model', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Minha Voz',
    urls: ['https://...audio1.wav', 'https://...audio2.wav'],
    transcripts: ['Olá', 'Como vai?']
  })
})
```

**O que acontece:**
1. Baixa áudios das URLs
2. Converte para base64
3. Chama Fish API `/v1/models`
4. Salva `model_id` no banco

---

### Etapa 4: Geração de Áudio

**Endpoint:** `POST /api/voices/generate`

```typescript
const response = await fetch('/api/voices/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    modelId: 'model-id-from-fish',
    text: 'Olá, este é um teste de voz.',
    params: {
      format: 'mp3',
      speed: 1.0,
      volume: 0,
      temperature: 0.9,
      top_p: 0.9,
      model: 's1'  // ou 'speech-1.5'
    }
  })
})
```

**O que acontece:**
1. Busca `model_id` no banco
2. Chama Fish API `/v1/tts`
3. Recebe áudio gerado
4. Salva no storage (opcional)
5. Retorna base64 ou URL

---

### Etapa 5: Validação

**Script:** `workers/validate_generation.py`

```bash
python workers/validate_generation.py \
  --reference path/to/reference.emb.json \
  --generated path/to/generated.wav \
  --threshold 0.82
```

**O que acontece:**
1. Carrega embedding de referência
2. Extrai embedding do áudio gerado
3. Calcula similaridade coseno
4. Aplica thresholds:
   - `>= 0.82`: ✅ OK
   - `0.75-0.82`: ⚠️ Revisar
   - `< 0.75`: ❌ Rejeitar

---

## 🧪 Testando o Pipeline

### 1. Pré-processar Áudio Individual

```bash
python workers/preprocess_and_embed.py \
  --input "/path/to/audio.wav" \
  --out "/path/to/output.wav" \
  --target-sr 24000
```

**Saída:**
- `output.wav` - Áudio processado
- `output.wav.emb.json` - Embedding em JSON

---

### 2. Testar Upload

```bash
curl -X POST http://localhost:3000/api/voices/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "name=Teste" \
  -F "audioCount=2" \
  -F "audio0=@audio1.wav" \
  -F "audio1=@audio2.wav"
```

---

### 3. Testar Criação de Modelo

```bash
curl -X POST http://localhost:3000/api/voices/create-model \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Voz Teste",
    "urls": ["https://...audio1.wav", "https://...audio2.wav"],
    "transcripts": ["Olá", "Como vai?"]
  }'
```

---

### 4. Testar Geração

```bash
curl -X POST http://localhost:3000/api/voices/generate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "modelId": "model-id-from-fish",
    "text": "Olá, este é um teste de voz.",
    "params": {
      "format": "mp3",
      "model": "s1"
    }
  }'
```

---

## 📊 Thresholds de Validação

| Similaridade | Status | Ação |
|-------------|--------|------|
| `>= 0.82` | ✅ OK | Aceitar |
| `0.75 - 0.82` | ⚠️ Revisar | Reprocessar com ajustes |
| `< 0.75` | ❌ Rejeitar | Falhou validação |

**Parâmetros para reprocessamento:**
- Reduzir `temperature` (0.9 → 0.7)
- Reduzir `top_p` (0.9 → 0.7)
- Usar modelo `s1` (garantir)
- Usar áudio de referência mais longo

---

## 🔧 Configuração Avançada

### Usar ECAPA-TDNN (mais preciso, requer GPU)

```python
# Em voice_embedding_extractor.py
extractor = VoiceEmbeddingExtractor(model_type="ecapa-tdnn")
```

### Treinar Modelo Local (VITS/Coqui TTS)

```python
# Em build_voice.py
pipeline = VoiceCloningPipeline(use_fish_api=False)
# Requer GPU e configuração adicional
```

### Forced Alignment (Opcional)

```bash
# Instalar Montreal Forced Aligner
pip install montreal-forced-alignment
```

---

## 📝 Notas Importantes

1. **Qualidade dos Áudios:**
   - Mínimo: 2-3 áudios de 20-50 segundos cada
   - Ambiente consistente (mesmo microfone)
   - Sem ruído de fundo

2. **Transcrições:**
   - Melhoram significativamente a qualidade
   - Devem corresponder exatamente ao áudio

3. **Modelo Fish API:**
   - Use `s1` para preservar gênero/timbre/sotaque
   - `speech-1.5` para qualidade máxima

4. **Reprocessamento:**
   - Se validação falhar, ajuste parâmetros
   - Máximo 3 tentativas
   - Marcar para revisão humana se persistir

---

## 🐛 Troubleshooting

### Erro: "Bucket não encontrado"
- Crie bucket `voice-clones` no Supabase Storage
- Configure permissões RLS

### Erro: "FISH_AUDIO_API_KEY não configurada"
- Configure variável no `.env.local`
- Reinicie servidor Next.js

### Erro: "Similaridade baixa"
- Verifique se áudios são da mesma voz
- Aumente quantidade de áudios de referência
- Use transcrições precisas

### Erro: "Model ID não encontrado"
- Verifique resposta da Fish API
- Use fallback para modelo local se necessário

---

## 📚 Referências

- [Fish Audio API Docs](https://docs.fish.audio)
- [Resemblyzer](https://github.com/resemble-ai/Resemblyzer)
- [SpeechBrain](https://speechbrain.github.io/)
- [Librosa](https://librosa.org/)

---

## ✅ Checklist de Implementação

- [x] Scripts Python de pré-processamento
- [x] Extração de embeddings
- [x] Worker pipeline completo
- [x] Endpoints Next.js (upload, create-model, generate)
- [x] Validação de similaridade
- [x] Helpers de storage/queue/db
- [x] Documentação completa

**Próximos passos:**
- [ ] Integrar com queue real (Redis/Bull)
- [ ] Adicionar reprocessamento automático
- [ ] Implementar validação de gênero/sotaque
- [ ] Adicionar monitoramento/logs

---

**Desenvolvido seguindo o pipeline profissional do Fish AI** 🎯

