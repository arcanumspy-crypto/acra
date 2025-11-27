# 🎬 Como Instalar FFmpeg no Windows

## 📥 Opção 1: Usando o Download Direto (Recomendado)

### Passo 1: Baixar FFmpeg
1. Acesse: https://ffmpeg.org/download.html
2. Clique em **Windows builds from gyan.dev** ou **Windows builds by BtbN**
3. Baixe a versão **essentials** (mais leve) ou **full** (completa)

### Passo 2: Extrair Arquivos
1. Extraia o arquivo ZIP baixado (ex: `ffmpeg-6.1.1-essentials_build.zip`)
2. Extraia para uma pasta fácil de encontrar, por exemplo:
   - `C:\ffmpeg`
   - `C:\Program Files\ffmpeg`
   - `C:\tools\ffmpeg`

### Passo 3: Adicionar ao PATH do Windows

#### Método A: Via Interface Gráfica (Mais Fácil)
1. Pressione `Win + R` e digite: `sysdm.cpl`
2. Clique na aba **Avançado**
3. Clique em **Variáveis de Ambiente**
4. Em **Variáveis do sistema**, encontre `Path` e clique em **Editar**
5. Clique em **Novo**
6. Adicione o caminho para a pasta `bin` do FFmpeg:
   - Exemplo: `C:\ffmpeg\ffmpeg-6.1.1-essentials_build\bin`
7. Clique em **OK** em todas as janelas

#### Método B: Via PowerShell (Como Administrador)
```powershell
# Substitua C:\ffmpeg\bin pelo caminho real da pasta bin
[Environment]::SetEnvironmentVariable("Path", $env:Path + ";C:\ffmpeg\ffmpeg-6.1.1-essentials_build\bin", [EnvironmentVariableTarget]::Machine)
```

### Passo 4: Verificar Instalação
1. **Feche e reabra** o PowerShell/Terminal
2. Execute:
```powershell
ffmpeg -version
```

Se aparecer informações da versão, está funcionando! ✅

---

## 📦 Opção 2: Usando Chocolatey (Mais Rápido)

Se você tem o Chocolatey instalado:

```powershell
# Executar como Administrador
choco install ffmpeg
```

---

## 📦 Opção 3: Usando Scoop

Se você tem o Scoop instalado:

```powershell
scoop install ffmpeg
```

---

## ✅ Verificar se Está Funcionando

Execute no PowerShell:

```powershell
ffmpeg -version
```

Você deve ver algo como:
```
ffmpeg version 6.1.1 Copyright (c) 2000-2023 the FFmpeg developers
...
```

---

## 🔧 Testar Conversão de Áudio

Teste se o FFmpeg consegue converter áudio:

```powershell
# Criar um arquivo de teste (se tiver um WAV)
ffmpeg -i input.wav -codec:a libmp3lame -b:a 128k output.mp3
```

---

## ⚠️ Problemas Comuns

### "ffmpeg não é reconhecido como comando"
- **Solução**: Verifique se adicionou o caminho correto ao PATH
- **Solução**: Feche e reabra o terminal/PowerShell
- **Solução**: Reinicie o computador (às vezes necessário)

### "Acesso negado" ao adicionar ao PATH
- **Solução**: Execute o PowerShell como Administrador

### Não encontrou a pasta `bin`
- **Solução**: Certifique-se de extrair o ZIP completo
- **Solução**: A pasta `bin` deve conter `ffmpeg.exe`, `ffprobe.exe`, etc.

---

## 📝 Próximos Passos

Depois de instalar o FFmpeg:

1. ✅ Verificar instalação: `ffmpeg -version`
2. ✅ Instalar dependências Python: `pip install -r requirements.txt`
3. ✅ Testar Coqui TTS: `python coqui_tts_generator.py --text "Olá" --output test.wav`

---

## 🆘 Precisa de Ajuda?

Se tiver problemas:
1. Verifique se o caminho está correto no PATH
2. Reinicie o terminal/PowerShell
3. Tente executar `ffmpeg.exe` diretamente do caminho completo:
   ```powershell
   C:\ffmpeg\ffmpeg-6.1.1-essentials_build\bin\ffmpeg.exe -version
   ```

