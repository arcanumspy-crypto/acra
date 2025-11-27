# 🛠️ Instalar FFmpeg Manualmente (Sem Instalador)

## ✅ Método: Extrair e Adicionar ao PATH Manualmente

### Passo 1: Baixar o ZIP dos Binários

1. Acesse: https://www.gyan.dev/ffmpeg/builds/
2. Baixe: **`ffmpeg-release-essentials.zip`**
   - Não precisa instalar nada, só baixar o ZIP

### Passo 2: Extrair o ZIP

1. Clique com botão direito no arquivo ZIP baixado
2. Selecione **"Extrair Tudo..."**
3. Escolha um local simples, por exemplo:
   - `C:\ffmpeg`
   - Ou `C:\tools\ffmpeg`
4. Clique em **"Extrair"**

### Passo 3: Verificar se Tem a Pasta `bin`

Após extrair, você deve ver:
```
C:\ffmpeg\ffmpeg-6.1.1-essentials_build\
└── bin\
    ├── ffmpeg.exe
    ├── ffplay.exe
    └── ffprobe.exe
```

### Passo 4: Adicionar ao PATH (Método Manual)

#### Opção A: Via Interface do Windows (Mais Fácil)

1. Pressione `Win + X` e escolha **"Sistema"**
2. Ou pressione `Win + R`, digite `sysdm.cpl` e pressione Enter
3. Clique em **"Avançado"**
4. Clique em **"Variáveis de Ambiente"**
5. Em **"Variáveis do sistema"**, encontre a variável `Path`
6. Clique em **"Editar"**
7. Clique em **"Novo"**
8. Cole o caminho completo da pasta `bin`:
   ```
   C:\ffmpeg\ffmpeg-6.1.1-essentials_build\bin
   ```
   (Ajuste o caminho se você extraiu em outro lugar)
9. Clique em **"OK"** em todas as janelas

#### Opção B: Via PowerShell (Como Administrador)

Abra o PowerShell **como Administrador** (clique com botão direito → Executar como administrador):

```powershell
# Substitua pelo caminho real onde você extraiu
$caminhoBin = "C:\ffmpeg\ffmpeg-6.1.1-essentials_build\bin"

# Adicionar ao PATH do sistema
$pathAtual = [Environment]::GetEnvironmentVariable("Path", "Machine")
$novoPath = $pathAtual + ";" + $caminhoBin
[Environment]::SetEnvironmentVariable("Path", $novoPath, "Machine")

Write-Host "✅ FFmpeg adicionado ao PATH!" -ForegroundColor Green
```

### Passo 5: Verificar Instalação

1. **Feche TODOS os terminais/PowerShell abertos**
2. Abra um **novo PowerShell** (não precisa ser administrador)
3. Execute:
```powershell
ffmpeg -version
```

Se aparecer informações da versão, está funcionando! ✅

## 🔍 Testar se Funciona

Execute no PowerShell:

```powershell
# Verificar versão
ffmpeg -version

# Verificar se está no PATH
Get-Command ffmpeg
```

## ⚠️ Se Ainda Não Funcionar

### Teste Direto (sem PATH):

```powershell
# Execute diretamente do caminho completo
C:\ffmpeg\ffmpeg-6.1.1-essentials_build\bin\ffmpeg.exe -version
```

Se funcionar assim, o problema é apenas o PATH. Tente:

1. Reiniciar o computador (às vezes necessário)
2. Verificar se o caminho está correto no PATH
3. Verificar se não tem espaços ou caracteres especiais no caminho

### Verificar se o Arquivo Existe:

```powershell
# Verificar se o arquivo existe
Test-Path "C:\ffmpeg\ffmpeg-6.1.1-essentials_build\bin\ffmpeg.exe"
```

Deve retornar `True`.

## 📝 Resumo Rápido

1. ✅ Baixe: https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip
2. ✅ Extraia para `C:\ffmpeg\`
3. ✅ Adicione `C:\ffmpeg\ffmpeg-6.1.1-essentials_build\bin` ao PATH
4. ✅ Feche e reabra o PowerShell
5. ✅ Teste: `ffmpeg -version`

## 🆘 Precisa de Ajuda?

Se o instalador está fechando sozinho ou negando permissões, use este método manual - não precisa de instalador, só extrair o ZIP e adicionar ao PATH!

