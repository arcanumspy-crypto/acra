# Migração para Coqui TTS

Este documento descreve a migração completa do projeto de Fish AI para Coqui TTS.

## 📋 Resumo das Mudanças

### Arquivos Criados
- `src/lib/coqui-tts.ts` - Biblioteca principal para Coqui TTS
- `src/lib/audio-converter.ts` - Conversor de WAV para MP3
- `workers/coqui_tts_generator.py` - Script Python para gerar TTS
- `workers/coqui_list_models.py` - Script para listar modelos disponíveis
- `workers/convert_wav_to_mp3.py` - Script para converter WAV para MP3
- `MIGRACAO_COQUI_TTS.md` - Este documento

### Arquivos Modificados
- `src/app/api/voices/generate-tts/route.ts` - Atualizado para usar Coqui TTS
- `src/app/api/voices/create-voice/route.ts` - Removidas referências ao Fish AI
- `workers/requirements.txt` - Adicionado Coqui TTS e dependências

### Arquivos Removidos/Depreciados
- `src/lib/fish-audio.ts` - **Pode ser removido** (não é mais usado)

## 🚀 Instalação

### 1. Instalar Dependências Python

```bash
cd workers
pip install -r requirements.txt
```

Isso instalará:
- `TTS>=0.22.0` - Coqui TTS
- `torch>=2.0.0` - PyTorch (requerido pelo Coqui TTS)
- `torchaudio>=2.0.0` - PyTorch Audio
- Outras dependências existentes

### 2. Instalar FFmpeg (para conversão de áudio)

**Windows:**
1. Baixe FFmpeg de https://ffmpeg.org/download.html
2. Extraia e adicione ao PATH
3. Ou use: `choco install ffmpeg` (se tiver Chocolatey)

**Linux:**
```bash
sudo apt-get update
sudo apt-get install ffmpeg
```

**macOS:**
```bash
brew install ffmpeg
```

### 3. Variáveis de Ambiente

Remova do `.env.local`:
- `FISH_AUDIO_API_KEY`
- `FISH_AUDIO_API_URL`

Adicione (opcional, tem valores padrão):
```env
# Coqui TTS Configuration
COQUI_TTS_MODEL=tts_models/pt/cv/vits
COQUI_TTS_VOCODER=vocoder_models/pt/cv/vits
COQUI_TTS_WORKER_DIR=./workers
COQUI_TTS_OUTPUT_DIR=./tmp/coqui-output
PYTHON_CMD=python  # ou py -3.12 no Windows
```

## 🎯 Como Usar

### Gerar TTS Simples

```typescript
import { generateTTS } from '@/lib/coqui-tts'

const audioBuffer = await generateTTS("Olá, este é um teste do Coqui TTS", {
  model: 'tts_models/pt/cv/vits',
  speed: 1.0,
  language: 'pt'
})
```

### Clonagem de Voz

```typescript
import { cloneVoice } from '@/lib/coqui-tts'

const audioBuffer = await cloneVoice(
  "Texto a ser falado",
  "/caminho/para/audio_referencia.wav",
  {
    speed: 1.0,
    language: 'pt'
  }
)
```

### Via API

**POST `/api/voices/generate-tts`**

```json
{
  "voiceId": "uuid-da-voz",
  "text": "Texto a ser convertido",
  "speed": 1.0,
  "language": "pt",
  "format": "mp3"
}
```

## 📦 Modelos Disponíveis

### Modelos Português (Recomendados)

- `tts_models/pt/cv/vits` - VITS em português (padrão)
- `tts_models/multilingual/multi-dataset/your_tts` - Multi-idioma com clonagem

### Listar Modelos

```bash
python workers/coqui_list_models.py
```

Ou via código:

```typescript
import { listAvailableModels } from '@/lib/coqui-tts'

const models = await listAvailableModels()
console.log(models)
```

### Instalar Novo Modelo

O Coqui TTS baixa modelos automaticamente na primeira execução. Para forçar download:

```python
from TTS.api import TTS

# Isso baixará o modelo automaticamente
tts = TTS(model_name="tts_models/pt/cv/vits")
```

## ⚙️ Configurações

### Velocidade
- Range: `0.5` a `2.0`
- Padrão: `1.0`

### Idioma
- Padrão: `pt` (português)
- Outros: `en`, `es`, `fr`, etc.

### Formato de Saída
- `wav` - Formato nativo do Coqui TTS
- `mp3` - Convertido automaticamente (requer ffmpeg)

## 🔧 Troubleshooting

### Erro: "Coqui TTS não está instalado"
```bash
pip install TTS
```

### Erro: "CUDA não disponível"
O Coqui TTS funciona em CPU, mas é mais lento. Para usar GPU:
1. Instale PyTorch com suporte CUDA
2. Configure `device: 'cuda'` nas opções

### Erro: "ffmpeg não encontrado"
Instale FFmpeg (veja seção Instalação acima)

### Áudio muito lento/rápido
Ajuste o parâmetro `speed`:
- `0.5` = metade da velocidade
- `2.0` = dobro da velocidade

### Qualidade ruim
1. Use áudios de referência de alta qualidade (WAV, 16kHz+)
2. Use modelos mais recentes
3. Ajuste parâmetros de velocidade

## 📝 Notas Importantes

1. **Primeira Execução**: O Coqui TTS baixa modelos automaticamente (pode demorar)
2. **Armazenamento**: Modelos são salvos em `~/.local/share/tts/`
3. **Performance**: CPU é mais lento, GPU acelera significativamente
4. **Clonagem**: Requer áudio de referência de pelo menos 3-5 segundos

## 🆚 Diferenças do Fish AI

| Recurso | Fish AI | Coqui TTS |
|---------|---------|-----------|
| API Externa | ✅ Sim | ❌ Não (local) |
| Clonagem | ✅ Sim | ✅ Sim |
| Modelos | Limitados | Muitos disponíveis |
| Custo | Pago | Gratuito |
| Privacidade | Dados na nuvem | 100% local |
| Instalação | Simples | Requer Python |

## 📚 Referências

- [Coqui TTS GitHub](https://github.com/coqui-ai/TTS)
- [Documentação Coqui TTS](https://tts.readthedocs.io/)
- [Modelos Disponíveis](https://github.com/coqui-ai/TTS/wiki/Released-Models)

