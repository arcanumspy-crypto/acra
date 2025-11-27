# 📥 Como Baixar FFmpeg Binários (Pré-compilado) para Windows

## ⚠️ IMPORTANTE: Você baixou o código-fonte!

O que você tem agora é o **código-fonte** do FFmpeg (precisa compilar). Você precisa dos **binários pré-compilados**.

## ✅ Solução: Baixar Binários Pré-compilados

### Opção 1: Gyan.dev (Recomendado - Mais Popular)

1. **Acesse**: https://www.gyan.dev/ffmpeg/builds/
2. **Baixe**: `ffmpeg-release-essentials.zip` (versão mais leve)
   - Ou `ffmpeg-release-full.zip` (versão completa com mais codecs)
3. **Extraia** o arquivo ZIP
4. **Dentro da pasta extraída**, você encontrará:
   ```
   ffmpeg-6.1.1-essentials_build/
   ├── bin/
   │   ├── ffmpeg.exe      ← Este é o que você precisa!
   │   ├── ffplay.exe
   │   └── ffprobe.exe
   ├── doc/
   └── presets/
   ```

### Opção 2: BtbN Builds (Alternativa)

1. **Acesse**: https://github.com/BtbN/FFmpeg-Builds/releases
2. **Baixe**: `ffmpeg-master-latest-win64-gpl.zip` (ou a versão mais recente)
3. **Extraia** o arquivo ZIP
4. **Dentro da pasta extraída**, você encontrará:
   ```
   ffmpeg-master-latest-win64-gpl/
   └── bin/
       ├── ffmpeg.exe
       ├── ffplay.exe
       └── ffprobe.exe
   ```

## 📋 Passo a Passo Completo

### 1. Baixar o Arquivo Correto

**Link direto (Gyan.dev - Essentials):**
- https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip

**Ou acesse:**
- https://www.gyan.dev/ffmpeg/builds/
- Clique em **"ffmpeg-release-essentials.zip"**

### 2. Extrair o ZIP

1. Clique com botão direito no arquivo ZIP
2. Selecione **"Extrair Tudo..."**
3. Escolha um local fácil (ex: `C:\ffmpeg`)
4. Clique em **"Extrair"**

### 3. Verificar a Pasta `bin`

Após extrair, você deve ver:
```
C:\ffmpeg\ffmpeg-6.1.1-essentials_build\
└── bin\
    ├── ffmpeg.exe      ← Este arquivo!
    ├── ffplay.exe
    └── ffprobe.exe
```

### 4. Adicionar ao PATH

#### Método Rápido (PowerShell como Administrador):

```powershell
# Substitua pelo caminho real da pasta bin
$ffmpegPath = "C:\ffmpeg\ffmpeg-6.1.1-essentials_build\bin"
[Environment]::SetEnvironmentVariable("Path", $env:Path + ";$ffmpegPath", [EnvironmentVariableTarget]::Machine)
```

#### Método Manual:

1. Pressione `Win + R`
2. Digite: `sysdm.cpl` e pressione Enter
3. Clique em **"Avançado"**
4. Clique em **"Variáveis de Ambiente"**
5. Em **"Variáveis do sistema"**, encontre `Path` e clique em **"Editar"**
6. Clique em **"Novo"**
7. Adicione o caminho completo da pasta `bin`:
   ```
   C:\ffmpeg\ffmpeg-6.1.1-essentials_build\bin
   ```
8. Clique em **"OK"** em todas as janelas

### 5. Verificar Instalação

1. **Feche e reabra** o PowerShell/Terminal
2. Execute:
```powershell
ffmpeg -version
```

Se aparecer informações da versão, está funcionando! ✅

## 🔍 Como Saber se Baixou o Arquivo Correto?

### ✅ Arquivo Correto (Binários):
- Nome: `ffmpeg-release-essentials.zip` ou `ffmpeg-release-full.zip`
- Tamanho: ~50-100 MB
- Dentro tem pasta `bin/` com `ffmpeg.exe`

### ❌ Arquivo Errado (Código-fonte):
- Nome: `ffmpeg-8.0.tar.xz` ou similar
- Tamanho: ~20-30 MB
- Dentro tem arquivos `configure`, `Makefile`, `README.md`
- **NÃO tem pasta `bin/`**

## 🆘 Ainda Não Funciona?

### Teste Direto (sem PATH):

```powershell
# Execute diretamente do caminho completo
C:\ffmpeg\ffmpeg-6.1.1-essentials_build\bin\ffmpeg.exe -version
```

Se funcionar assim, o problema é apenas o PATH. Siga o passo 4 novamente.

### Verificar se o Arquivo Existe:

```powershell
# Verificar se o arquivo existe
Test-Path "C:\ffmpeg\ffmpeg-6.1.1-essentials_build\bin\ffmpeg.exe"
```

Deve retornar `True`.

## 📝 Resumo

1. ✅ Baixe: https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip
2. ✅ Extraia para `C:\ffmpeg\` (ou onde preferir)
3. ✅ Adicione `C:\ffmpeg\ffmpeg-6.1.1-essentials_build\bin` ao PATH
4. ✅ Feche e reabra o terminal
5. ✅ Teste: `ffmpeg -version`

