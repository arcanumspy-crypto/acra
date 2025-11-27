# ✅ Resumo da Migração: Fish AI → Coqui TTS

## 📦 Arquivos Criados

### TypeScript/Next.js
1. **`src/lib/coqui-tts.ts`** - Biblioteca principal para Coqui TTS
   - Função `generateTTS()` - Gera TTS simples
   - Função `cloneVoice()` - Clonagem de voz com áudio de referência
   - Função `listAvailableModels()` - Lista modelos disponíveis
   - Função `generateTextHash()` - Hash para cache

2. **`src/lib/audio-converter.ts`** - Conversor de WAV para MP3
   - Função `convertWavToMp3()` - Converte WAV para MP3 usando Python

### Python Workers
3. **`workers/coqui_tts_generator.py`** - Script principal para gerar TTS
   - Suporta clonagem de voz com `--speaker_wav`
   - Configurações de velocidade, idioma, modelo
   - Retorna JSON com informações da geração

4. **`workers/coqui_list_models.py`** - Lista modelos disponíveis
   - Retorna JSON com lista de modelos

5. **`workers/convert_wav_to_mp3.py`** - Conversor WAV → MP3
   - Usa pydub e ffmpeg

### Documentação
6. **`MIGRACAO_COQUI_TTS.md`** - Documentação completa
7. **`README_COQUI_TTS.md`** - Guia rápido
8. **`RESUMO_MIGRACAO.md`** - Este arquivo

## 🔄 Arquivos Modificados

### Endpoints API
1. **`src/app/api/voices/generate-tts/route.ts`**
   - ✅ Removida importação de `fish-audio`
   - ✅ Adicionada importação de `coqui-tts`
   - ✅ Substituída lógica de geração para usar Coqui TTS
   - ✅ Removidas referências ao Fish API
   - ✅ Adicionada conversão WAV → MP3 quando necessário

2. **`src/app/api/voices/create-voice/route.ts`**
   - ✅ Removida toda lógica de criação de modelo na Fish API
   - ✅ Removidas variáveis `FISH_AUDIO_API_KEY` e `FISH_AUDIO_API_URL`
   - ✅ Simplificada lógica para salvar apenas áudios de referência
   - ✅ Atualizado `metadata.cloning_method` para `'coqui_tts'`

### Dependências
3. **`workers/requirements.txt`**
   - ✅ Adicionado `TTS>=0.22.0`
   - ✅ Adicionado `torch>=2.0.0`
   - ✅ Adicionado `torchaudio>=2.0.0`

## 🗑️ Arquivos para Remover (Opcional)

- **`src/lib/fish-audio.ts`** - Não é mais usado, pode ser deletado

## 🔧 Variáveis de Ambiente

### Remover do `.env.local`:
```env
FISH_AUDIO_API_KEY=...
FISH_AUDIO_API_URL=...
```

### Adicionar (Opcional - tem valores padrão):
```env
# Coqui TTS Configuration
COQUI_TTS_MODEL=tts_models/pt/cv/vits
COQUI_TTS_VOCODER=vocoder_models/pt/cv/vits
COQUI_TTS_WORKER_DIR=./workers
COQUI_TTS_OUTPUT_DIR=./tmp/coqui-output
PYTHON_CMD=python  # ou py -3.12 no Windows
```

## 📋 Próximos Passos

### 1. Instalar Dependências
```bash
cd workers
pip install -r requirements.txt
```

### 2. Instalar FFmpeg (para conversão MP3)
- **Windows**: Baixar de https://ffmpeg.org/download.html ou `choco install ffmpeg`
- **Linux**: `sudo apt-get install ffmpeg`
- **macOS**: `brew install ffmpeg`

### 3. Testar Instalação
```bash
python workers/coqui_tts_generator.py --text "Olá, mundo" --output test.wav
```

### 4. Testar API
```bash
# Gerar TTS via API
curl -X POST http://localhost:3000/api/voices/generate-tts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "voiceId": "uuid-da-voz",
    "text": "Olá, este é um teste",
    "speed": 1.0,
    "language": "pt"
  }'
```

## ⚠️ Notas Importantes

1. **Primeira Execução**: O Coqui TTS baixa modelos automaticamente (pode demorar alguns minutos)
2. **Modelos**: Salvos em `~/.local/share/tts/` (Linux/Mac) ou `%USERPROFILE%\.local\share\tts\` (Windows)
3. **Performance**: CPU funciona mas é lento. GPU acelera significativamente
4. **Clonagem**: Requer áudio de referência de pelo menos 3-5 segundos
5. **Formato**: Coqui TTS gera WAV por padrão. MP3 é convertido automaticamente se solicitado

## 🆚 Comparação: Fish AI vs Coqui TTS

| Aspecto | Fish AI | Coqui TTS |
|---------|---------|-----------|
| **API Externa** | ✅ Sim | ❌ Não (local) |
| **Custo** | 💰 Pago | 🆓 Gratuito |
| **Privacidade** | ☁️ Dados na nuvem | 🔒 100% local |
| **Instalação** | ✅ Simples | ⚙️ Requer Python |
| **Modelos** | Limitados | Muitos disponíveis |
| **Clonagem** | ✅ Sim | ✅ Sim |
| **Performance** | ⚡ Rápido (cloud) | 🐌 Lento (CPU) / ⚡ Rápido (GPU) |

## 📚 Documentação

- **Completa**: `MIGRACAO_COQUI_TTS.md`
- **Rápida**: `README_COQUI_TTS.md`
- **Coqui TTS**: https://github.com/coqui-ai/TTS

## ✅ Checklist de Migração

- [x] Criar biblioteca Coqui TTS
- [x] Criar scripts Python
- [x] Atualizar endpoint generate-tts
- [x] Atualizar endpoint create-voice
- [x] Atualizar requirements.txt
- [x] Criar documentação
- [ ] Instalar dependências Python
- [ ] Instalar FFmpeg
- [ ] Testar geração de áudio
- [ ] Remover arquivo fish-audio.ts (opcional)
- [ ] Atualizar variáveis de ambiente

## 🎉 Conclusão

A migração está completa! O projeto agora usa Coqui TTS localmente em vez da API Fish AI. 

**Vantagens:**
- ✅ Gratuito
- ✅ 100% privado (dados não saem do servidor)
- ✅ Muitos modelos disponíveis
- ✅ Open source

**Desvantagens:**
- ⚠️ Requer instalação de Python e dependências
- ⚠️ Mais lento em CPU (GPU acelera)
- ⚠️ Primeira execução baixa modelos (pode demorar)

