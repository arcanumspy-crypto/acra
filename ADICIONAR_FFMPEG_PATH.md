# ✅ Adicionar FFmpeg ao PATH - Solução do Erro de Permissão

## ⚠️ Erro: "Acesso ao Registro solicitado não é permitido"

Este erro acontece porque você precisa de **permissões de Administrador**.

## ✅ Solução 1: Executar PowerShell como Administrador

### Passo a Passo:

1. **Feche o PowerShell atual**

2. **Abra PowerShell como Administrador:**
   - Pressione `Win + X`
   - Clique em **"Windows PowerShell (Admin)"** ou **"Terminal (Admin)"**
   - OU clique com botão direito no menu Iniciar → **"Windows PowerShell (Admin)"**
   - Confirme quando pedir permissão (clique em "Sim")

3. **Execute os comandos novamente:**

```powershell
# Defina o caminho completo (ajuste se necessário)
$caminhoBin = "C:\Users\PRECISION\Downloads\ffmpeg-2025-11-24-git-c732564d2e-essentials_build\ffmpeg-2025-11-24-git-c732564d2e-essentials_build\bin"

# Verificar se o caminho existe
Test-Path $caminhoBin

# Adicionar ao PATH do sistema
$pathAtual = [Environment]::GetEnvironmentVariable("Path", "Machine")
$novoPath = $pathAtual + ";" + $caminhoBin
[Environment]::SetEnvironmentVariable("Path", $novoPath, "Machine")

Write-Host "✅ FFmpeg adicionado ao PATH com sucesso!" -ForegroundColor Green
```

4. **Feche e reabra o PowerShell** (não precisa ser admin agora)

5. **Teste:**
```powershell
ffmpeg -version
```

---

## ✅ Solução 2: Adicionar ao PATH do Usuário (Sem Admin)

Se não conseguir executar como Admin, você pode adicionar apenas ao PATH do seu usuário:

```powershell
# Defina o caminho completo
$caminhoBin = "C:\Users\PRECISION\Downloads\ffmpeg-2025-11-24-git-c732564d2e-essentials_build\ffmpeg-2025-11-24-git-c732564d2e-essentials_build\bin"

# Adicionar ao PATH do USUÁRIO (não precisa de admin)
$pathAtual = [Environment]::GetEnvironmentVariable("Path", "User")
$novoPath = $pathAtual + ";" + $caminhoBin
[Environment]::SetEnvironmentVariable("Path", $novoPath, "User")

Write-Host "✅ FFmpeg adicionado ao PATH do usuário!" -ForegroundColor Green
```

**Nota:** Isso só funciona para o seu usuário, mas não precisa de admin.

---

## ✅ Solução 3: Método Manual (Interface Gráfica)

Se preferir usar a interface do Windows:

1. Pressione `Win + R`
2. Digite: `sysdm.cpl` e pressione Enter
3. Clique em **"Avançado"**
4. Clique em **"Variáveis de Ambiente"**
5. Em **"Variáveis do usuário"** (ou "Variáveis do sistema" se tiver admin), encontre `Path`
6. Clique em **"Editar"**
7. Clique em **"Novo"**
8. Cole o caminho:
   ```
   C:\Users\PRECISION\Downloads\ffmpeg-2025-11-24-git-c732564d2e-essentials_build\ffmpeg-2025-11-24-git-c732564d2e-essentials_build\bin
   ```
9. Clique em **"OK"** em todas as janelas

---

## 🔍 Verificar se Funcionou

Depois de adicionar ao PATH:

1. **Feche TODOS os terminais**
2. Abra um **novo PowerShell** (normal, não precisa ser admin)
3. Execute:
```powershell
ffmpeg -version
```

Se aparecer informações da versão, está funcionando! ✅

---

## 💡 Dica: Mover para Local Mais Simples

O caminho atual está muito longo. Você pode mover para um local mais simples:

```powershell
# Mover para C:\ffmpeg (mais fácil)
Move-Item "C:\Users\PRECISION\Downloads\ffmpeg-2025-11-24-git-c732564d2e-essentials_build" "C:\ffmpeg"

# Depois adicionar ao PATH:
$caminhoBin = "C:\ffmpeg\ffmpeg-2025-11-24-git-c732564d2e-essentials_build\bin"
```

---

## 🆘 Ainda Não Funciona?

### Teste Direto (sem PATH):

```powershell
# Execute diretamente do caminho completo
C:\Users\PRECISION\Downloads\ffmpeg-2025-11-24-git-c732564d2e-essentials_build\ffmpeg-2025-11-24-git-c732564d2e-essentials_build\bin\ffmpeg.exe -version
```

Se funcionar assim, o problema é apenas o PATH. Tente reiniciar o computador após adicionar ao PATH.

