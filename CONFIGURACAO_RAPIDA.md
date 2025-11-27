# ⚡ Configuração Rápida - Modo Desenvolvimento (Apenas Fish API)

## 🎯 Objetivo

Usar apenas a API key do Fish Audio, **sem precisar configurar Supabase**.

---

## 📝 Passo 1: Configurar `.env.local`

Adicione estas variáveis no arquivo `.env.local` na raiz do projeto:

```bash
# Fish Audio API (OBRIGATÓRIO)
FISH_AUDIO_API_KEY=7c0f58472b724703abc385164af007b5
FISH_AUDIO_API_URL=https://api.fish.audio

# Modo Desenvolvimento (ATIVAR)
ALLOW_FISH_API_KEY_ONLY=true

# Frontend: API key do Fish (para o frontend enviar automaticamente)
NEXT_PUBLIC_FISH_AUDIO_API_KEY=7c0f58472b724703abc385164af007b5
```

**⚠️ IMPORTANTE:** Reinicie o servidor Next.js após alterar `.env.local`!

---

## ✅ Passo 2: Testar

1. **Reinicie o servidor:**
   ```bash
   # Pare o servidor (Ctrl+C) e inicie novamente
   npm run dev
   ```

2. **Acesse a página de vozes:**
   - Vá para `/voices`
   - Não precisa fazer login no Supabase!

3. **Tente criar uma voz:**
   - Selecione 2-3 arquivos de áudio
   - Clique em "Criar Voz"
   - Deve funcionar sem erro de autenticação!

---

## 🔍 Logs Esperados (Sucesso)

**No console do servidor:**
```
🚀 POST /api/voices/create-voice - Iniciando...
🔐 Verificando autenticação...
   Modo desenvolvimento: true
   Header x-fish-api-key: Presente
   FISH_AUDIO_API_KEY configurada: Sim
⚠️ MODO DESENVOLVIMENTO: Validando API key do Fish do header...
   API Key (primeiros 10 chars): 7c0f58472b...
✅ Modo desenvolvimento ativado - API key do Fish válida (do header)
📥 Lendo formData...
```

**No console do navegador:**
```
⚠️ MODO DESENVOLVIMENTO: Usando API key do Fish (sem autenticação Supabase)
   ✅ Enviando header x-fish-api-key
```

---

## ❌ Se Ainda Não Funcionar

### Erro: "hasFishApiKey: false"

**Causa:** O frontend não está enviando o header `x-fish-api-key`.

**Solução:**
1. Verifique se `NEXT_PUBLIC_FISH_AUDIO_API_KEY` está no `.env.local`
2. Reinicie o servidor Next.js
3. Limpe o cache do navegador (Ctrl+Shift+R)

### Erro: "API key do Fish inválida"

**Causa:** A API key do header não corresponde à do `.env.local`.

**Solução:**
1. Verifique se `FISH_AUDIO_API_KEY` e `NEXT_PUBLIC_FISH_AUDIO_API_KEY` têm o mesmo valor
2. Certifique-se de que não há espaços extras

### Erro: "ALLOW_FISH_API_KEY_ONLY não está ativado"

**Causa:** A variável não está configurada ou está como `false`.

**Solução:**
1. Adicione `ALLOW_FISH_API_KEY_ONLY=true` no `.env.local`
2. Reinicie o servidor

---

## 🚀 Para Produção

**NÃO use este modo em produção!**

1. Configure o Supabase corretamente
2. Remova `ALLOW_FISH_API_KEY_ONLY=true` do `.env.local`
3. Remova `NEXT_PUBLIC_FISH_AUDIO_API_KEY` (não exponha a API key no frontend)
4. Use autenticação normal via Supabase

---

**Configuração rápida concluída!** ✅ Teste agora.

