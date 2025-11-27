# 🔧 Solução: Coqui TTS com Python 3.12

## ⚠️ Problema

O Coqui TTS oficial (`TTS`) não suporta Python 3.12 ainda. Ele requer Python <3.12.

## ✅ Solução: Usar Fork `coqui-tts`

Existe um fork mantido pela comunidade que suporta Python 3.12: **`coqui-tts`**

### Instalação

```powershell
# Instalar o fork compatível com Python 3.12
pip install coqui-tts

# Ou instalar todas as dependências
pip install -r requirements.txt
```

### Diferença

- **`TTS`** (oficial): Não suporta Python 3.12
- **`coqui-tts`** (fork): Suporta Python 3.12 ✅

### Uso

O uso é **idêntico** ao TTS oficial:

```python
from TTS.api import TTS

tts = TTS(model_name="tts_models/pt/cv/vits")
tts.tts_to_file(text="Olá, mundo", file_path="output.wav")
```

## 📝 Alternativa: Usar Python 3.11

Se preferir usar o TTS oficial, você pode usar Python 3.11:

1. Instalar Python 3.11
2. Criar ambiente virtual com Python 3.11:
   ```powershell
   py -3.11 -m venv venv
   .\venv\Scripts\Activate
   pip install -r requirements.txt
   ```

## ✅ Recomendação

**Use `coqui-tts`** - é mais simples e funciona com Python 3.12 que você já tem instalado!

