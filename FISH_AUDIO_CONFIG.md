# 🔑 Configuração da Fish Audio API

## ✅ API Key Fornecida

Sua API Key da Fish Audio foi configurada:
```
7c0f58472b724703abc385164af007b5
```

## 🔧 Configuração Necessária

### 1. Adicionar no arquivo `.env.local`

Crie ou edite o arquivo `.env.local` na raiz do projeto:

```env
# Fish Audio API
FISH_AUDIO_API_KEY=7c0f58472b724703abc385164af007b5
FISH_AUDIO_API_URL=https://api.fish.audio

# Supabase (já existentes)
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key_aqui
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui
```

### 2. Testar a Integração

Execute o script de teste para verificar se a API está funcionando:

```bash
node test-fish-audio.js
```

Este script irá:
- ✅ Testar autenticação
- ✅ Verificar endpoints disponíveis
- ✅ Testar estrutura de resposta

### 3. Executar o Servidor

Após configurar as variáveis de ambiente:

```bash
npm run dev
```

### 4. Testar na Interface

1. Acesse `http://localhost:3000/login`
2. Faça login
3. Vá para `/voices`
4. Teste o upload de áudio e geração de TTS

## 📝 Notas Importantes

⚠️ **Segurança**: 
- Nunca commite a API Key no Git
- Mantenha o `.env.local` no `.gitignore`
- A API Key já está protegida no backend (nunca exposta no frontend)

✅ **Proteções Implementadas**:
- API Key apenas no servidor (server-side)
- Validação de autenticação em todas as rotas
- Validação de propriedade (usuário só acessa suas vozes)
- Row Level Security no banco de dados

## 🔍 Troubleshooting

Se encontrar problemas:

1. **API Key não reconhecida**:
   - Verifique se adicionou no `.env.local`
   - Reinicie o servidor Next.js após adicionar
   - Verifique se não há espaços extras na chave

2. **Endpoints não encontrados**:
   - Execute `node test-fish-audio.js` para verificar endpoints disponíveis
   - Os endpoints podem variar - ajustaremos conforme necessário

3. **Erro de autenticação**:
   - Verifique se a API Key está correta
   - Verifique se a conta Fish Audio está ativa
   - Veja logs do servidor para mais detalhes

## 🎯 Próximos Passos

1. ✅ Configure `.env.local` com a API Key
2. ✅ Execute `node test-fish-audio.js` para validar
3. ✅ Teste na interface `/voices`
4. 📧 Me avise se encontrar algum problema para ajustarmos!

