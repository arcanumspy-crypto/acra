# 🧪 Guia Completo de Testes - Pipeline de Clonagem de Voz

## ✅ Variáveis de Ambiente Configuradas

As variáveis foram configuradas no arquivo `.env.local`. 

**⚠️ IMPORTANTE:** Você precisa substituir `SUPABASE_SERVICE_ROLE_KEY` pela sua chave real!

### Como obter a Service Role Key:

1. Acesse: https://app.supabase.com/project/vahqjpblgirjbhglsiqm/settings/api
2. Copie a **"service_role" key** (não a anon key!)
3. Cole no arquivo `.env.local` substituindo `sua_service_role_key_aqui`

---

## 🧪 Testes - Passo a Passo

### 1️⃣ Testar Instalação Python

```powershell
cd workers
py -3.12 test_install.py
```

**Resultado esperado:**
```
✅ Básicos: librosa, soundfile, numpy, scipy - OK
⚠️ webrtcvad não disponível - usando mock
✅ Resemblyzer - OK
✅ Utilitários: requests, noisereduce, pydub - OK
🎉 Teste concluído!
```

---

### 2️⃣ Testar Pré-processamento de Áudio

**Preparar um arquivo de áudio de teste:**
- Formato: WAV, MP3, ou qualquer formato suportado
- Duração: 10-30 segundos (recomendado)
- Localização: qualquer pasta

**Comando:**
```powershell
cd workers
py -3.12 preprocess_and_embed.py --input "C:\caminho\para\seu\audio.wav" --out "audio_processado.wav"
```

**Resultado esperado:**
```
🚀 Iniciando processamento: C:\caminho\para\seu\audio.wav
🎵 Pré-processando: ...
✅ Áudio processado: audio_processado.wav
✅ Embedding extraído: shape (256,), len 256
✅ Embedding salvo: audio_processado.wav.emb.json
✅ Processamento concluído!
```

**Arquivos gerados:**
- `audio_processado.wav` - Áudio pré-processado
- `audio_processado.wav.emb.json` - Embedding em JSON

---

### 3️⃣ Testar Servidor Next.js

**Iniciar servidor:**
```powershell
# Na raiz do projeto (não em workers/)
npm run dev
```

**Verificar no console:**
```
🔍 Verificando variáveis Fish Audio (server-side):
  FISH_AUDIO_API_URL: https://api.fish.audio
  FISH_AUDIO_API_KEY: 7c0f58472b... (deve mostrar os primeiros caracteres)
```

**Se aparecer "NÃO DEFINIDO":**
- Verifique se o arquivo `.env.local` está na raiz do projeto
- Reinicie o servidor (Ctrl+C e `npm run dev` novamente)

---

### 4️⃣ Testar Upload de Áudios (API)

**Preparar:**
- 2-3 arquivos de áudio (WAV ou MP3)
- Cada um com 10-30 segundos

**Comando (PowerShell):**
```powershell
# Criar FormData e enviar
$formData = @{
    name = "Voz Teste"
    audioCount = "2"
    audio0 = Get-Item "C:\caminho\audio1.wav"
    audio1 = Get-Item "C:\caminho\audio2.wav"
    transcripts = '["Olá, este é um teste", "Como vai você?"]'
}

# Enviar requisição (ajuste a URL e token)
Invoke-RestMethod -Uri "http://localhost:3000/api/voices/upload" `
    -Method Post `
    -Form $formData `
    -Headers @{Authorization = "Bearer SEU_TOKEN_AQUI"}
```

**Ou usar Postman/Insomnia:**
- URL: `POST http://localhost:3000/api/voices/upload`
- Tipo: `multipart/form-data`
- Campos:
  - `name`: "Voz Teste"
  - `audioCount`: "2"
  - `audio0`: (arquivo)
  - `audio1`: (arquivo)
  - `transcripts`: `["Olá", "Como vai?"]`

**Resultado esperado:**
```json
{
  "success": true,
  "jobId": "job_xxx",
  "urls": ["https://...audio1.wav", "https://...audio2.wav"],
  "message": "Áudios enviados com sucesso. Processamento iniciado."
}
```

---

### 5️⃣ Testar Criação de Modelo (API)

**Comando:**
```powershell
$body = @{
    name = "Voz Teste"
    urls = @(
        "https://...audio1.wav",
        "https://...audio2.wav"
    )
    transcripts = @("Olá", "Como vai?")
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/voices/create-model" `
    -Method Post `
    -Body $body `
    -ContentType "application/json" `
    -Headers @{Authorization = "Bearer SEU_TOKEN"}
```

**Resultado esperado:**
```json
{
  "success": true,
  "model_id": "model_xxx",
  "voiceModel": {
    "id": "...",
    "name": "Voz Teste",
    "model_id": "model_xxx",
    "status": "ready"
  }
}
```

---

### 6️⃣ Testar Geração de Áudio (API)

**Comando:**
```powershell
$body = @{
    modelId = "model_xxx"  # ID retornado no passo anterior
    text = "Olá, este é um teste de voz clonada."
    params = @{
        format = "mp3"
        model = "s1"
        speed = 1.0
        temperature = 0.9
    }
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/voices/generate" `
    -Method Post `
    -Body $body `
    -ContentType "application/json" `
    -Headers @{Authorization = "Bearer SEU_TOKEN"}
```

**Resultado esperado:**
```json
{
  "success": true,
  "audio_base64": "UklGRiQAAABXQVZF...",
  "audio_url": "https://...generated.mp3",
  "format": "mp3",
  "size": 123456
}
```

---

### 7️⃣ Testar Validação de Similaridade

**Comando:**
```powershell
cd workers
py -3.12 validate_generation.py `
    --reference "audio_processado.wav.emb.json" `
    --generated "C:\caminho\audio_gerado.wav" `
    --threshold 0.82
```

**Resultado esperado:**
```json
{
  "similarity": 0.85,
  "ok": true,
  "threshold": 0.82,
  "status": "ok"
}
```

---

## 🔍 Verificações Importantes

### ✅ Checklist de Configuração

- [ ] Arquivo `.env.local` criado na raiz do projeto
- [ ] `SUPABASE_SERVICE_ROLE_KEY` configurada (não deixe como "sua_service_role_key_aqui")
- [ ] `FISH_AUDIO_API_KEY` configurada
- [ ] Servidor Next.js reiniciado após criar `.env.local`
- [ ] Python 3.12 instalado e funcionando
- [ ] Dependências Python instaladas (`test_install.py` passa)

### ✅ Checklist de Testes

- [ ] Teste de instalação Python passa
- [ ] Pré-processamento de áudio funciona
- [ ] Servidor Next.js inicia sem erros
- [ ] Variáveis de ambiente aparecem no console
- [ ] Upload de áudios funciona
- [ ] Criação de modelo funciona
- [ ] Geração de áudio funciona

---

## 🐛 Troubleshooting

### Erro: "Missing Supabase environment variables"
- Verifique se `.env.local` está na raiz (não em `workers/`)
- Reinicie o servidor Next.js

### Erro: "FISH_AUDIO_API_KEY não configurada"
- Verifique se a chave está no `.env.local`
- Reinicie o servidor

### Erro: "SUPABASE_SERVICE_ROLE_KEY não configurada"
- Obtenha a chave em: https://app.supabase.com/project/_/settings/api
- Cole no `.env.local`
- Reinicie o servidor

### Erro: "webrtcvad não disponível"
- **Não é um erro!** O patch já está aplicado
- O pipeline funciona normalmente sem webrtcvad

### Erro: "ModuleNotFoundError"
- Execute: `py -3.12 -m pip install -r requirements.txt`
- Ou use o método de instalação sem webrtcvad

---

## 📝 Próximos Passos Após Testes

1. ✅ Todos os testes passando
2. ⏭️ Configurar bucket `voice-clones` no Supabase Storage
3. ⏭️ Testar com áudios reais de 20-50 segundos
4. ⏭️ Validar qualidade da voz gerada
5. ⏭️ Ajustar thresholds de validação se necessário

---

**Boa sorte com os testes!** 🚀

