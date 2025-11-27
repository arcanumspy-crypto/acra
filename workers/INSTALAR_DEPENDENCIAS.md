# Como Instalar Dependências Python

## ⚠️ Python não está instalado

O erro `pip não é reconhecido` indica que o Python não está instalado no seu sistema.

---

## 🚀 Solução Rápida

### Opção 1: Instalar via Microsoft Store (Mais Fácil)

1. Abra a **Microsoft Store** (pressione `Win + S` e digite "Microsoft Store")
2. Procure por **"Python 3.11"** ou **"Python 3.12"**
3. Clique em **Instalar**
4. Aguarde a instalação
5. **Feche e reabra o PowerShell**
6. Teste: `python --version`
7. Instale dependências: `python -m pip install -r requirements.txt`

---

### Opção 2: Instalar via Site Oficial

1. Acesse: **https://www.python.org/downloads/**
2. Baixe **Python 3.11** ou **3.12** (Windows installer)
3. Execute o instalador
4. **MARQUE:** ✅ **"Add Python to PATH"** (muito importante!)
5. Clique em **"Install Now"**
6. Aguarde a instalação
7. **Feche e reabra o PowerShell**
8. Teste: `python --version`
9. Instale dependências: `python -m pip install -r requirements.txt`

---

## ✅ Após Instalar Python

Navegue até a pasta `workers` e execute:

```powershell
# Certifique-se de estar na pasta workers
cd workers

# Instalar dependências
python -m pip install -r requirements.txt
```

**Nota:** Use `python -m pip` ao invés de apenas `pip` no Windows.

---

## 🔍 Verificar Instalação

```powershell
# Verificar Python
python --version
# Deve mostrar: Python 3.11.x ou 3.12.x

# Verificar pip
python -m pip --version
# Deve mostrar: pip 23.x.x ou similar
```

---

## 🐛 Se Ainda Não Funcionar

### 1. Reiniciar PowerShell
Feche e abra um **novo** PowerShell após instalar Python.

### 2. Usar Caminho Completo
Se Python estiver instalado mas não no PATH:

```powershell
# Ajuste o caminho conforme sua instalação
C:\Python311\python.exe -m pip install -r requirements.txt
```

### 3. Instalar como Administrador
Execute PowerShell como **Administrador** e tente novamente.

---

## 📦 Dependências que Serão Instaladas

- `librosa` - Processamento de áudio
- `soundfile` - Leitura/escrita de arquivos de áudio
- `noisereduce` - Redução de ruído
- `resemblyzer` - Extração de embeddings de voz
- `numpy` - Computação numérica
- `scipy` - Processamento científico
- `requests` - Requisições HTTP
- `python-dotenv` - Gerenciamento de variáveis de ambiente

**Tempo estimado:** 5-10 minutos (dependendo da conexão)

---

## 🎯 Próximos Passos

Após instalar Python e as dependências:

1. ✅ Testar pré-processamento:
   ```powershell
   python preprocess_and_embed.py --help
   ```

2. ✅ Configurar variáveis de ambiente (`.env.local`)

3. ✅ Testar upload de áudios via API

---

**Precisa de ajuda?** Veja `INSTALACAO_PYTHON_WINDOWS.md` para mais detalhes.

