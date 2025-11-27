# Problema: Voz Masculina Retornando Feminina

## 🐛 Problema Relatado

Quando o usuário envia um áudio de referência **masculino**, às vezes a geração retorna uma voz **feminina**. Isso não é um clone correto.

## 📝 Status Atual

Aguardando documentação da Fish Audio para entender:
1. Quais parâmetros controlam o gênero da voz gerada
2. Se há alguma configuração específica para garantir consistência de gênero
3. Se é necessário usar múltiplos áudios de referência
4. Se há algum parâmetro adicional na API que precisa ser configurado

## 🔍 Áreas para Investigar

### 1. Parâmetro `pitch`
Atualmente estamos usando `pitch: 1.0` (sem alteração), mas pode haver outros parâmetros:
- `gender` - Se existe um parâmetro para forçar gênero
- `voice_id` - Se precisamos especificar o ID do modelo base
- `model` - Se há diferentes modelos de voz

### 2. Múltiplos Áudios de Referência
Estamos usando múltiplos áudios (2-3) de 20-50 segundos cada, mas pode ser necessário:
- Usar todos os áudios em todas as requisições (não apenas o primeiro)
- Especificar qual áudio usar como referência principal
- Enviar todos os áudios como array de referências

### 3. Configuração da API
Pode haver parâmetros adicionais na API:
- `reference_audio` format (como estamos enviando)
- `reference_text` (transcrição do áudio de referência)
- `voice_embedding` ou similar

## ✅ Correções Implementadas

### 1. Uso de Múltiplos Áudios de Referência
**Antes**: Usava apenas o primeiro áudio de referência
**Agora**: Usa o áudio mais longo de todos os áudios disponíveis (2-3 áudios)

**Mudanças em `src/lib/fish-audio.ts`**:
- Função `generateTTS()` agora aceita `referenceAudio: Buffer | string | Buffer[]`
- Quando recebe array de Buffers, seleciona o áudio mais longo (mais representativo)
- Log detalhado para debug

**Mudanças em `src/app/api/voices/generate-tts/route.ts`**:
- Agora passa TODOS os áudios de referência como array para `generateTTS()`
- A função escolhe automaticamente o melhor áudio

### 2. Logs Melhorados
- Logs mostram quantos áudios estão sendo usados
- Indicação clara de qual áudio foi selecionado

## 📋 Localizações no Código

### Arquivos Relevantes:
1. `src/lib/fish-audio.ts` - Função `generateTTS()` (linha ~102) ✅ ATUALIZADO
2. `src/app/api/voices/generate-tts/route.ts` - Endpoint de geração (linha ~148) ✅ ATUALIZADO
3. `src/lib/voice-validation.ts` - Validação de consistência

### Código Atualizado:
```typescript
// src/app/api/voices/generate-tts/route.ts
const audioBuffer = await generateTTS(
  voiceClone.voice_id,
  text,
  {
    speed: speed || 1.0,
    pitch: pitch || 1.0, // Não alterar tom automaticamente
    format: format || 'mp3',
  },
  referenceAudioBuffers, // TODOS os áudios de referência (array)
  undefined // referenceText (opcional)
)

// src/lib/fish-audio.ts
// Função agora aceita Buffer[] e seleciona o áudio mais longo
if (Array.isArray(referenceAudio) && referenceAudio.length > 0) {
  // Seleciona o áudio mais longo para máxima consistência
  let longestAudio = referenceAudio[0]
  for (const audio of referenceAudio) {
    if (audio.length > longestAudio.length) {
      longestAudio = audio
    }
  }
  requestBody.reference_audio = longestAudio.toString('base64')
}
```

## ✅ Próximos Passos

### Já Implementado:
1. ✅ Uso de múltiplos áudios de referência (seleciona o mais longo)
2. ✅ Passa todos os áudios disponíveis para a função
3. ✅ Logs detalhados para debug

### Ainda a Investigar (quando possível):
1. 🔍 Verificar se a API aceita array de `reference_audio` (usar TODOS os áudios simultaneamente)
2. 🔍 Verificar se há parâmetro `gender` ou similar na API
3. 🔍 Implementar combinação de múltiplos áudios em um só arquivo se necessário
4. 🔍 Adicionar `reference_text` (transcrição) para melhor resultado
5. 🔍 Testar com áudio masculino e verificar se retorna masculino consistentemente

### Observações:
- A documentação menciona que múltiplos áudios (2-3) de 20-50 segundos melhoram a qualidade
- Estamos usando 2-3 áudios, mas apenas o mais longo na API
- **Pode ser necessário combinar TODOS os áudios em um arquivo único** para máxima consistência

## 🎯 Objetivo

Garantir que:
- Áudio masculino de entrada → Voz masculina na saída (100%)
- Áudio feminino de entrada → Voz feminina na saída (100%)
- Consistência total entre áudio de referência e voz gerada

