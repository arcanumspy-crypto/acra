# ⚠️ Problema: Python 3.14 Não Suportado

## Erro Encontrado

```
RuntimeError: Cannot install on Python version 3.14.0; 
only versions >=3.10,<3.14 are supported.
```

Algumas bibliotecas (como `resemblyzer` ou dependências) ainda não suportam Python 3.14.

---

## ✅ Solução Recomendada: Usar Python 3.11 ou 3.12

### Opção 1: Instalar Python 3.12 (Recomendado)

1. **Baixe Python 3.12:**
   - Acesse: https://www.python.org/downloads/release/python-3120/
   - Baixe "Windows installer (64-bit)"

2. **Instale Python 3.12:**
   - Execute o instalador
   - ✅ **MARQUE:** "Add Python to PATH"
   - ✅ **MARQUE:** "Install for all users" (opcional)
   - Clique em "Install Now"

3. **Verificar instalação:**
   ```powershell
   python3.12 --version
   # Deve mostrar: Python 3.12.0
   ```

4. **Instalar dependências com Python 3.12:**
   ```powershell
   cd workers
   python3.12 -m pip install -r requirements.txt
   ```

---

### Opção 2: Usar py Launcher (Múltiplas Versões)

Se você tem múltiplas versões do Python instaladas:

```powershell
# Listar versões disponíveis
py --list

# Instalar com versão específica
py -3.12 -m pip install -r requirements.txt
```

---

### Opção 3: Tentar Instalar Sem Resemblyzer (Temporário)

Se precisar usar Python 3.14 imediatamente, pode tentar instalar sem `resemblyzer`:

```powershell
cd workers

# Instalar dependências básicas
python -m pip install librosa soundfile noisereduce numpy scipy requests python-dotenv pydub

# Tentar instalar resemblyzer separadamente (pode falhar)
python -m pip install resemblyzer
```

**Nota:** Sem `resemblyzer`, a extração de embeddings não funcionará. Você precisará usar uma alternativa ou aguardar suporte para Python 3.14.

---

## 🔄 Alternativas ao Resemblyzer

Se `resemblyzer` não funcionar no Python 3.14, você pode usar:

### 1. SpeechBrain (Requer GPU)

```powershell
python -m pip install speechbrain torch torchaudio
```

Depois, em `voice_embedding_extractor.py`, use:
```python
extractor = VoiceEmbeddingExtractor(model_type="ecapa-tdnn")
```

### 2. Usar API Externa

Usar serviço externo para extração de embeddings (ex: Hugging Face API).

---

## 📋 Checklist

- [ ] Python 3.12 instalado
- [ ] Python 3.12 adicionado ao PATH
- [ ] PowerShell reiniciado
- [ ] Dependências instaladas: `python3.12 -m pip install -r requirements.txt`
- [ ] Teste: `python3.12 preprocess_and_embed.py --help`

---

## 🎯 Recomendação Final

**Use Python 3.12** para melhor compatibilidade com todas as bibliotecas necessárias.

Python 3.14 é muito novo e muitas bibliotecas ainda não foram atualizadas para suportá-lo.

---

## 📚 Links Úteis

- [Python 3.12 Downloads](https://www.python.org/downloads/release/python-3120/)
- [Python 3.11 Downloads](https://www.python.org/downloads/release/python-3110/)
- [Resemblyzer GitHub](https://github.com/resemble-ai/Resemblyzer)

