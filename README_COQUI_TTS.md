# Guia Rápido - Coqui TTS

## 🚀 Instalação Rápida

```bash
# 1. Instalar dependências Python
cd workers
pip install -r requirements.txt

# 2. Testar instalação
python coqui_tts_generator.py --text "Olá, mundo" --output test.wav
```

## 📝 Exemplo de Uso

### Via API (Next.js)

```bash
curl -X POST http://localhost:3000/api/voices/generate-tts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "voiceId": "uuid-da-voz",
    "text": "Olá, este é um teste do Coqui TTS",
    "speed": 1.0,
    "language": "pt",
    "format": "mp3"
  }'
```

### Via Código TypeScript

```typescript
import { generateTTS } from '@/lib/coqui-tts'

// TTS simples
const audio = await generateTTS("Olá, mundo", {
  model: 'tts_models/pt/cv/vits',
  speed: 1.0
})

// Clonagem de voz
const audio = await cloneVoice(
  "Texto a ser falado",
  "/caminho/para/referencia.wav",
  { speed: 1.0 }
)
```

## ⚙️ Configuração

### Variáveis de Ambiente (Opcional)

```env
COQUI_TTS_MODEL=tts_models/pt/cv/vits
PYTHON_CMD=python  # ou py -3.12 no Windows
```

## 🎯 Modelos Recomendados

- **Português**: `tts_models/pt/cv/vits` (padrão)
- **Multi-idioma**: `tts_models/multilingual/multi-dataset/your_tts`

## 📚 Documentação Completa

Veja `MIGRACAO_COQUI_TTS.md` para documentação completa.

