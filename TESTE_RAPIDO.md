# ⚡ Teste Rápido - Pipeline de Clonagem de Voz

## ✅ Variáveis Configuradas

O arquivo `.env.local` já está configurado com:
- ✅ Supabase URL e Anon Key
- ✅ Fish Audio API Key
- ⚠️ **AÇÃO NECESSÁRIA:** Substitua `SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui` pela sua chave real

**Obter Service Role Key:**
1. Acesse: https://app.supabase.com/project/vahqjpblgirjbhglsiqm/settings/api
2. Copie a **"service_role" key**
3. Cole no `.env.local`

---

## 🧪 Testes Rápidos (5 minutos)

### 1. Testar Python (30 segundos)

```powershell
cd workers
py -3.12 test_install.py
```

**Deve mostrar:** ✅ Todos os módulos OK

---

### 2. Testar Pré-processamento (1 minuto)

```powershell
# Use qualquer arquivo de áudio (WAV, MP3)
py -3.12 preprocess_and_embed.py --input "C:\caminho\audio.wav"
```

**Resultado:** Arquivos `audio.proc.wav` e `audio.proc.wav.emb.json` criados

---

### 3. Testar Servidor Next.js (2 minutos)

```powershell
# Na raiz do projeto
npm run dev
```

**Verificar no console:**
- ✅ `FISH_AUDIO_API_URL: https://api.fish.audio`
- ✅ `FISH_AUDIO_API_KEY: 7c0f58472b...` (não deve mostrar "NÃO DEFINIDO")

**Acesse:** http://localhost:3000

---

### 4. Testar API de Upload (1 minuto)

**Usando PowerShell:**
```powershell
# Preparar arquivos de teste
$formData = @{
    name = "Teste"
    audioCount = "1"
    audio0 = Get-Item "C:\caminho\audio.wav"
}

# Enviar (ajuste URL e token)
Invoke-RestMethod -Uri "http://localhost:3000/api/voices/upload" `
    -Method Post -Form $formData
```

**Ou usar Postman/Insomnia:**
- POST `http://localhost:3000/api/voices/upload`
- Form-data:
  - `name`: "Teste"
  - `audioCount`: "1"
  - `audio0`: (seu arquivo)

---

## 📋 Checklist Rápido

- [ ] Python 3.12 instalado
- [ ] Dependências instaladas (`test_install.py` passa)
- [ ] `.env.local` configurado
- [ ] `SUPABASE_SERVICE_ROLE_KEY` substituída
- [ ] Servidor Next.js inicia sem erros
- [ ] Variáveis aparecem no console

---

## 🎯 Próximo Passo

Após todos os testes passarem:
1. Configure o bucket `voice-clones` no Supabase Storage
2. Teste com áudios reais (2-3 arquivos de 20-50 segundos)
3. Valide a qualidade da voz gerada

---

**Veja `GUIA_TESTE_COMPLETO.md` para testes detalhados!**

