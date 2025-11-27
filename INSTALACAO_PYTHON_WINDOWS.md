# Instalação do Python no Windows

## 🐍 Python não está instalado

Para usar os scripts Python do pipeline de clonagem de voz, você precisa instalar o Python primeiro.

---

## 📥 Opção 1: Instalar via Microsoft Store (Recomendado)

1. Abra a **Microsoft Store** no Windows
2. Procure por **"Python 3.11"** ou **"Python 3.12"**
3. Clique em **Instalar**
4. Aguarde a instalação concluir

**Vantagens:**
- Instalação automática
- Atualizações automáticas
- Configuração do PATH automática

---

## 📥 Opção 2: Instalar via Site Oficial

1. Acesse: https://www.python.org/downloads/
2. Baixe a versão mais recente (Python 3.11 ou 3.12)
3. Execute o instalador
4. **IMPORTANTE:** Marque a opção **"Add Python to PATH"** durante a instalação
5. Clique em **"Install Now"**

**Verificar instalação:**
```powershell
python --version
# Deve mostrar: Python 3.11.x ou Python 3.12.x
```

---

## ✅ Verificar Instalação

Após instalar, abra um **novo PowerShell** e teste:

```powershell
# Verificar versão
python --version

# Verificar pip
pip --version

# Ou usar py launcher
py --version
```

---

## 🔧 Se Python estiver instalado mas não funcionar

### 1. Verificar se está no PATH

```powershell
# Verificar se Python está no PATH
$env:PATH -split ';' | Select-String python
```

### 2. Adicionar Python ao PATH manualmente

1. Abra **Configurações do Sistema** → **Variáveis de Ambiente**
2. Em **Variáveis do Sistema**, encontre **Path**
3. Clique em **Editar**
4. Adicione os caminhos:
   - `C:\Python311\` (ou versão instalada)
   - `C:\Python311\Scripts\`
5. Clique em **OK** e reinicie o PowerShell

### 3. Usar caminho completo

Se Python estiver instalado mas não no PATH, use o caminho completo:

```powershell
# Exemplo (ajuste o caminho conforme sua instalação)
C:\Python311\python.exe -m pip install -r requirements.txt
```

---

## 📦 Instalar Dependências

Após instalar Python, navegue até a pasta `workers` e instale as dependências:

```powershell
cd workers
python -m pip install -r requirements.txt
```

**Ou se usar py launcher:**

```powershell
cd workers
py -m pip install -r requirements.txt
```

---

## 🚨 Problemas Comuns

### Erro: "pip não é reconhecido"

**Solução:** Use `python -m pip` ao invés de apenas `pip`:

```powershell
python -m pip install -r requirements.txt
```

### Erro: "Python não está no PATH"

**Solução:** Reinstale Python marcando "Add Python to PATH" ou adicione manualmente ao PATH.

### Erro: "Permission denied"

**Solução:** Execute PowerShell como Administrador ou use `--user`:

```powershell
python -m pip install --user -r requirements.txt
```

---

## 🎯 Próximos Passos

Após instalar Python e as dependências:

1. ✅ Verificar instalação: `python --version`
2. ✅ Instalar dependências: `python -m pip install -r workers/requirements.txt`
3. ✅ Testar script: `python workers/preprocess_and_embed.py --help`

---

## 📚 Links Úteis

- [Python Downloads](https://www.python.org/downloads/)
- [Python no Windows](https://docs.python.org/3/using/windows.html)
- [pip Documentation](https://pip.pypa.io/)

---

**Nota:** Para desenvolvimento de produção, considere usar um ambiente virtual (`venv`) para isolar as dependências do projeto.

