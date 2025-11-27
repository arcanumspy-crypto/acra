# Correção: Preservação de Sotaque Moçambicano

## 🔴 Problema Reportado

**Sintoma**: Áudio com sotaque moçambicano de entrada → Voz com sotaque brasileiro de saída

**Causa Identificada**: O sistema não estava preservando o sotaque do áudio de referência. A API da Fish Audio pode estar assumindo português brasileiro (pt-BR) como padrão quando o idioma não é especificado.

## ✅ Correção Implementada

### 1. Campo de Seleção de Idioma/Sotaque

**Frontend**:
- ✅ Adicionado dropdown para seleção de idioma/sotaque
- ✅ Opção padrão: **"Detectar do áudio (Recomendado)"** (vazio)
- ✅ Opções disponíveis:
  - Detectar do áudio (Recomendado) - **preserva sotaque moçambicano**
  - Português (Detectar sotaque)
  - Português (Brasil)
  - **Português (Moçambique)** ← Para forçar sotaque moçambicano
  - Português (Portugal)
  - Inglês
  - Espanhol

### 2. Parâmetro Language na API

**Backend**:
- ✅ Recebe parâmetro `language` do frontend
- ✅ Se `language` estiver vazio ou undefined, **não especifica** na requisição
- ✅ Isso permite que o modelo **detecte automaticamente** do áudio de referência
- ✅ Se especificado (ex: "pt-MZ"), usa o idioma/sotaque específico

### 3. Logs Detalhados

Agora os logs mostram:
- ✅ Se o idioma foi especificado ou não
- ✅ Aviso se o idioma não foi especificado (modelo deve detectar)
- ✅ Alerta se vier com sotaque errado

## 📋 Como Funciona

### Cenário 1: Idioma Não Especificado (Recomendado)
```typescript
language: undefined // ou ''
```
- Modelo deve **detectar automaticamente** do áudio de referência
- Preserva o sotaque do áudio original (moçambicano)
- **Melhor opção** para preservar sotaque único

### Cenário 2: Idioma Especificado (Forçar)
```typescript
language: 'pt-MZ' // Português Moçambique
```
- Força o uso do sotaque moçambicano
- Útil se a detecção automática falhar
- Pode não ser necessário se o modelo detectar corretamente

### Cenário 3: Problema Persistente
Se ainda vier com sotaque brasileiro:
1. **Deixe vazio** (detectar do áudio) - Teste primeiro
2. Se não funcionar, **especifique "pt-MZ"** explicitamente
3. Se ainda não funcionar, pode ser limitação da API

## 🎯 Como Testar

1. **Envie áudio com sotaque moçambicano** (2-3 áudios, 20-50 segundos cada)
2. **Gere uma narração**:
   - Deixe o campo "Idioma/Sotaque" vazio (Detectar do áudio)
   - OU selecione "Português (Moçambique)" explicitamente
3. **Verifique os logs**:
   ```
   Idioma: NÃO ESPECIFICADO - modelo deve detectar do áudio de referência
   ⚠️ Se vier com sotaque brasileiro, especifique o idioma explicitamente
   ```
4. **Escute o áudio gerado**:
   - Deve ter sotaque **moçambicano** (não brasileiro) ✅
   - Se vier brasileiro, especifique "pt-MZ" e tente novamente

## 📝 Arquivos Modificados

### Frontend:
- `src/app/(auth)/voices/page.tsx`:
  - ✅ Estado `language` adicionado
  - ✅ Dropdown de seleção de idioma/sotaque
  - ✅ Envia `language` na requisição

- `src/app/(auth)/voices/[id]/page.tsx`:
  - ✅ Mesmos controles adicionados
  - ✅ Interface consistente

### Backend:
- `src/lib/fish-audio.ts`:
  - ✅ Logs detalhados sobre idioma
  - ✅ Avisos se idioma não especificado

- `src/app/api/voices/generate-tts/route.ts`:
  - ✅ Recebe parâmetro `language`
  - ✅ Passa para função `generateTTS`
  - ✅ Logs mostram idioma usado

## ⚠️ Importante

1. **Padrão Recomendado**: Deixe o campo vazio para detectar automaticamente
2. **Se Vier Brasileiro**: Selecione "Português (Moçambique)" explicitamente
3. **Teste Ambos**: Tente primeiro vazio, depois force "pt-MZ" se necessário

## 🔍 Logs Esperados

### Com Detecção Automática:
```
🌍 Idioma não especificado - modelo deve detectar do áudio de referência
⚠️ Se vier com sotaque brasileiro, especifique o idioma explicitamente
```

### Com Idioma Especificado:
```
🌍 Idioma especificado: "pt-MZ" (preserva sotaque)
```

## ✅ Resultado Esperado

Agora, quando você enviar áudio com sotaque moçambicano:
- ✅ O áudio gerado deve ter **sotaque moçambicano** (não brasileiro)
- ✅ Gênero, timbre e sotaque devem ser preservados
- ✅ Se não preservar automaticamente, force com "pt-MZ"

## 🧪 Teste Agora

1. **Deixe "Idioma/Sotaque" vazio** (Detectar do áudio)
2. **Gere uma narração** com seu áudio moçambicano
3. **Escute**: Deve ter sotaque moçambicano ✅
4. **Se vier brasileiro**: Selecione "Português (Moçambique)" e tente novamente

