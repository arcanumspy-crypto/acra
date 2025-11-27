# 🚀 Instalar Python 3.12.1 (Rápido)

## ✅ Sim, Python 3.12.1 funciona perfeitamente!

Qualquer versão **3.12.x** (3.12.0, 3.12.1, 3.12.2, etc.) é compatível.

---

## 📥 Passo a Passo Rápido

### 1. Baixar Python 3.12.1

**Link direto:** https://www.python.org/downloads/release/python-3121/

Ou acesse: https://www.python.org/downloads/ e baixe a versão mais recente do Python 3.12

### 2. Instalar

1. Execute o arquivo baixado (ex: `python-3.12.1-amd64.exe`)
2. **✅ MARQUE:** "Add Python 3.12 to PATH" (muito importante!)
3. Clique em **"Install Now"**
4. Aguarde a instalação

### 3. Verificar

Feche e reabra o PowerShell, depois execute:

```powershell
python --version
# Deve mostrar: Python 3.12.1
```

**OU se tiver múltiplas versões:**

```powershell
py -3.12 --version
# Deve mostrar: Python 3.12.1
```

### 4. Instalar Dependências

```powershell
cd workers
python -m pip install -r requirements.txt
```

**OU se usar py launcher:**

```powershell
cd workers
py -3.12 -m pip install -r requirements.txt
```

---

## 🎯 Após Instalar

Você pode usar:

- `python` (se 3.12 for a versão padrão)
- `python3.12` (versão específica)
- `py -3.12` (via launcher)

Todos funcionarão! ✅

---

## ⚠️ Importante

- **Feche e reabra o PowerShell** após instalar
- Certifique-se de marcar "Add Python to PATH"
- Se tiver Python 3.14 também instalado, use `py -3.12` para especificar a versão

---

**Pronto! Python 3.12.1 instalado e funcionando!** 🎉

