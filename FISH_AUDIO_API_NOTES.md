# 📝 Notas sobre a Integração com Fish Audio API

## 🔗 Documentação Oficial

- **Introdução**: https://docs.fish.audio/developer-guide/getting-started/introduction
- **API Keys**: https://fish.audio/app/api-keys/
- **Registro**: https://fish.audio/auth/signup

## ⚠️ Endpoints que Precisam ser Confirmados

Quando você fornecer a API Key, vamos precisar testar e ajustar os seguintes endpoints:

### 1. Criar Modelo de Voz Persistente
**Endpoint atual implementado**: `POST /v1/voices`

**Possíveis variações**:
- `POST /v1/models`
- `POST /v1/voices/create`
- `POST /api/v1/voices`

**Parâmetros esperados**:
- `audio` (FormData): Arquivo de áudio
- `title` (string): Nome do modelo
- `description` (string): Descrição opcional
- `visibility` (string): 'private' ou 'public'

**Resposta esperada**:
```json
{
  "id": "voice_id_aqui",
  "voice_id": "voice_id_aqui",
  "status": "processing" | "ready",
  "title": "Nome do modelo"
}
```

### 2. Gerar TTS (Text-to-Speech)
**Endpoint atual implementado**: `POST /v1/tts`

**Parâmetros esperados**:
```json
{
  "voice_id": "id_do_modelo",
  "text": "Texto a ser convertido",
  "format": "mp3" | "wav",
  "speed": 1.0,
  "pitch": 1.0
}
```

**Resposta esperada**:
- Áudio binário (MP3/WAV) OU
- JSON com `audio_url` OU
- JSON com `audio` em base64

## 🧪 Como Testar Quando Receber a API Key

1. **Configurar variável de ambiente**:
   ```bash
   FISH_AUDIO_API_KEY=sua_chave_aqui
   ```

2. **Testar criação de modelo**:
   ```bash
   curl -X POST https://api.fish.audio/v1/voices \
     -H "Authorization: Bearer $FISH_AUDIO_API_KEY" \
     -F "audio=@test_audio.wav" \
     -F "title=Test Voice" \
     -F "visibility=private"
   ```

3. **Testar TTS**:
   ```bash
   curl -X POST https://api.fish.audio/v1/tts \
     -H "Authorization: Bearer $FISH_AUDIO_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "voice_id": "id_retornado",
       "text": "Olá, este é um teste",
       "format": "mp3"
     }'
   ```

## 📋 Checklist de Ajustes Necessários

Quando você fornecer a API Key, precisaremos:

- [ ] Confirmar URL base da API (`https://api.fish.audio` ou outra)
- [ ] Testar endpoint de criação de modelo de voz
- [ ] Ajustar campos do FormData conforme necessário
- [ ] Testar endpoint de TTS
- [ ] Ajustar formato de resposta (binário, URL ou base64)
- [ ] Testar autenticação (Bearer Token)
- [ ] Verificar limites de uso e rate limiting
- [ ] Testar com diferentes formatos de áudio

## 🔍 Referências da Documentação

Baseado na documentação fornecida:
- Fish Audio suporta clonagem a partir de **15 segundos de áudio**
- Modelos podem ser **privados** ou **públicos**
- Suporta **múltiplas amostras** para melhor qualidade
- Recomendado gravar em **ambiente silencioso**
- Formato recomendado: **WAV** de alta qualidade

## 💡 Próximos Passos

Quando você me fornecer a API Key:
1. Vou testar os endpoints
2. Ajustar o código conforme necessário
3. Validar o formato de resposta
4. Testar upload e geração de áudio
5. Corrigir quaisquer problemas encontrados

**Aguardando sua API Key para testes e ajustes finais!** 🚀

