# 🔧 Solução: Erro webrtcvad (Microsoft Visual C++)

## ⚠️ Problema

O pacote `webrtcvad` precisa ser compilado e requer **Microsoft Visual C++ Build Tools**.

```
error: Microsoft Visual C++ 14.0 or greater is required.
```

---

## ✅ Solução 1: Instalar SEM webrtcvad (Recomendado)

O `webrtcvad` é usado apenas para detecção de voz ativa, **não é essencial** para o pipeline básico.

### Instalar dependências sem webrtcvad:

```powershell
cd workers
py -3.12 -m pip install -r requirements-sem-webrtcvad.txt
```

Depois, instale resemblyzer sem webrtcvad:

```powershell
py -3.12 -m pip install resemblyzer --no-deps
py -3.12 -m pip install torch
```

**Funcionalidade:** O pipeline funcionará normalmente, apenas sem detecção de voz ativa (que não é crítica).

---

## ✅ Solução 2: Instalar Microsoft C++ Build Tools

Se realmente precisar do `webrtcvad`:

1. **Baixe Microsoft C++ Build Tools:**
   - Acesse: https://visualstudio.microsoft.com/visual-cpp-build-tools/
   - Baixe "Build Tools for Visual Studio"

2. **Instale:**
   - Execute o instalador
   - Marque "C++ build tools"
   - Clique em "Install"
   - Aguarde (pode demorar vários minutos)

3. **Reinicie o PowerShell** e tente novamente:
   ```powershell
   py -3.12 -m pip install -r requirements.txt
   ```

**Tempo estimado:** 15-30 minutos (download + instalação)

---

## ✅ Solução 3: Usar Wheel Pré-compilado (Se disponível)

Tentar instalar webrtcvad de wheel pré-compilado:

```powershell
py -3.12 -m pip install webrtcvad --only-binary :all:
```

Se não funcionar, use a Solução 1.

---

## 🎯 Recomendação

**Use a Solução 1** - instalar sem webrtcvad. O pipeline funcionará perfeitamente sem ele.

O `webrtcvad` é usado apenas para:
- Detecção de voz ativa (VAD)
- Remoção de silêncio (mas já fazemos isso com librosa)

**Nossos scripts já fazem trim de silêncio com librosa**, então não precisamos do webrtcvad!

---

## 📋 Passos Rápidos (Solução 1)

```powershell
# 1. Navegar até workers
cd workers

# 2. Instalar dependências sem webrtcvad
py -3.12 -m pip install -r requirements-sem-webrtcvad.txt

# 3. Instalar resemblyzer sem dependências problemáticas
py -3.12 -m pip install resemblyzer --no-deps
py -3.12 -m pip install torch

# 4. Verificar instalação
py -3.12 -c "import resemblyzer; print('OK!')"
```

---

## ✅ Após Instalar

Teste o script:

```powershell
py -3.12 preprocess_and_embed.py --help
```

Se funcionar, está tudo pronto! 🎉

