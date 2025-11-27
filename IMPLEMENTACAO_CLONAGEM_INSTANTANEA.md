# 🎤 Implementação - Clonagem Instantânea Fish Audio

## ✅ Status Atual

- ✅ Endpoint TTS confirmado e funcionando: `POST /v1/tts`
- ❌ Endpoint de criação de modelo persistente não encontrado (404)
- 💡 Solução: Usar **Clonagem Instantânea** com `reference_audio`

## 🔧 Como Funciona a Clonagem Instantânea

A Fish Audio permite clonar voz instantaneamente sem criar modelo persistente:

```javascript
POST /v1/tts
{
  "text": "Texto a ser narrado",
  "reference_audio": "base64_do_audio_ou_url",
  "reference_text": "Texto falado no áudio" // opcional mas recomendado
}
```

## 📝 Mudanças Necessárias

### 1. Ajustar função `generateTTS`

Já ajustada para suportar `reference_audio`!

### 2. Ajustar rota de criação de voz

Como não há endpoint para criar modelo persistente, temos duas opções:

**Opção A: Salvar áudio de referência no banco e usar clonagem instantânea**
- Salvar áudio no Supabase Storage
- Usar URL ou base64 do áudio ao gerar TTS
- Mais simples e funciona agora

**Opção B: Investigar SDK oficial**
- Instalar SDK: `npm install fish-audio`
- Usar SDK para criar modelos persistentes
- Mais complexo mas melhor para produção

## 🚀 Implementação Recomendada (Opção A)

### 1. Salvar áudio no Supabase Storage ao criar "voz"

Quando o usuário faz upload:
1. Salvar áudio no Supabase Storage
2. Obter URL pública do áudio
3. Salvar no banco: `voice_clones` com `audio_url`

### 2. Gerar TTS usando clonagem instantânea

Quando gerar TTS:
1. Buscar `audio_url` da voz no banco
2. Fazer fetch do áudio (ou usar base64 já salvo)
3. Enviar para `/v1/tts` com `reference_audio`

## 📋 Checklist de Implementação

- [x] Função `generateTTS` ajustada para suportar `reference_audio`
- [ ] Ajustar rota `/api/voices/create-voice` para salvar áudio no Storage
- [ ] Ajustar rota `/api/voices/generate-tts` para usar clonagem instantânea
- [ ] Testar upload e geração completa
- [ ] Validar qualidade do áudio gerado

## 💡 Vantagens da Clonagem Instantânea

✅ **Funciona agora** - Endpoint já testado e confirmado
✅ **Sem SDK** - Usa apenas REST API
✅ **Flexível** - Pode usar URL ou base64
✅ **Simples** - Menos complexidade

## ⚠️ Considerações

- **Performance**: Pode ser mais lento que modelo persistente
- **Custo**: Envia áudio a cada geração (mais dados)
- **Limites**: Verificar limites da API

## 🔄 Migração Futura

Quando encontrarmos endpoint de modelos persistentes:
1. Criar endpoint para salvar modelo na Fish Audio
2. Obter `voice_id` do modelo
3. Usar `voice_id` ao invés de `reference_audio`
4. Mais eficiente para múltiplas gerações

