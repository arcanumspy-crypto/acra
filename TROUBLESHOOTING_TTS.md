# 🔧 Solução de Problemas - Coqui TTS no Windows

## ✅ Modelo XTTS v2

O modelo correto do XTTS v2 é:
```
tts_models/multilingual/multi-dataset/xtts_v2
```

**NÃO use**: `tts_models/multilingual/multilingual/v2` (nome incorreto)

---

## ❌ Erro: `OSError: [WinError 127] Não foi possível encontrar o procedimento especificado`

Este erro ocorre quando o `torchaudio` não consegue carregar suas bibliotecas nativas no Windows.

### 🔍 Causa

O problema geralmente é causado por:
1. **Incompatibilidade entre versões** do PyTorch e torchaudio
2. **Falta de dependências do Windows** (Visual C++ Redistributables)
3. **Instalação corrompida** do torchaudio

### ✅ Soluções

#### Solução 1: Reinstalar PyTorch e torchaudio (Recomendado)

```bash
# Desinstalar versões antigas
pip uninstall torch torchaudio

# Instalar versões compatíveis (CPU)
pip install torch torchaudio --index-url https://download.pytorch.org/whl/cpu

# OU se você tem GPU NVIDIA (CUDA 11.8)
pip install torch torchaudio --index-url https://download.pytorch.org/whl/cu118

# OU se você tem GPU NVIDIA (CUDA 12.1)
pip install torch torchaudio --index-url https://download.pytorch.org/whl/cu121
```

#### Solução 2: Instalar Visual C++ Redistributables

1. Baixe o instalador:
   - **x64**: https://aka.ms/vs/17/release/vc_redist.x64.exe
   - **x86**: https://aka.ms/vs/17/release/vc_redist.x86.exe

2. Execute o instalador e reinicie o computador

3. Tente executar o TTS novamente

#### Solução 3: Verificar versão do Python

Certifique-se de usar Python 3.8, 3.9, 3.10, 3.11 ou 3.12:

```bash
python --version
```

Se necessário, reinstale o Python:
- Baixe de: https://www.python.org/downloads/
- Marque a opção "Add Python to PATH" durante a instalação

#### Solução 4: Criar ambiente virtual limpo

```bash
# Criar novo ambiente virtual
python -m venv venv_tts

# Ativar (Windows)
venv_tts\Scripts\activate

# Instalar dependências
pip install --upgrade pip
pip install TTS
pip install torch torchaudio --index-url https://download.pytorch.org/whl/cpu
```

#### Solução 5: Verificar se há conflitos de versão

```bash
# Verificar versões instaladas
pip list | findstr torch

# Deve mostrar algo como:
# torch           2.1.0
# torchaudio      2.1.0
```

Se as versões forem diferentes, reinstale seguindo a Solução 1.

### 🧪 Teste de Instalação

Após aplicar as soluções, teste se o TTS funciona:

```bash
python -c "from TTS.api import TTS; print('✅ TTS instalado corretamente!')"
```

Se der erro, verifique a mensagem e aplique a solução correspondente.

### 📝 Notas Adicionais

- **Windows Defender/Antivírus**: Pode bloquear DLLs. Adicione exceção para a pasta do Python
- **Permissões**: Execute o terminal como Administrador se necessário
- **Reiniciar**: Após instalar Visual C++ Redistributables, reinicie o computador

### 🆘 Ainda com problemas?

1. Verifique os logs completos do erro
2. Certifique-se de que está usando Python 64-bit (não 32-bit)
3. Tente usar um ambiente virtual isolado (Solução 4)
4. Verifique se há outros processos Python rodando que podem estar usando as DLLs

