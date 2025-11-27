# ⚠️ CONFIGURAÇÃO IMPORTANTE - .env.local

## 🔴 Problemas Identificados

1. ❌ `SUPABASE_SERVICE_ROLE_KEY` não configurada
2. ❌ `FISH_AUDIO_API_KEY` não estava no `.env.local`
3. ❌ Variáveis não foram carregadas porque o servidor não foi reiniciado

## ✅ Solução

### 1. Adicione a `SUPABASE_SERVICE_ROLE_KEY` no `.env.local`

**Como obter:**
1. Acesse: https://app.supabase.com/project/vahqjpblgirjbhglsiqm/settings/api
2. Copie a **Service Role Key** (secret key)
3. Adicione no `.env.local`:

```env
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui
```

**⚠️ IMPORTANTE:** Esta key é **server-side apenas** - nunca expor no frontend!

### 2. Verifique se o `.env.local` está completo:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://vahqjpblgirjbhglsiqm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhaHFqcGJsZ2lyamJoZ2xzaXFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4NTI2MzcsImV4cCI6MjA3OTQyODYzN30.hQ-BjXpzNAQYYbfhx87KYU_ICgAVstHQMyymPXBY6Rk
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui

# Fish Audio API
FISH_AUDIO_API_KEY=7c0f58472b724703abc385164af007b5
FISH_AUDIO_API_URL=https://api.fish.audio
```

### 3. ⚠️ **CRÍTICO: Reinicie o Servidor!**

```bash
# Pare o servidor (Ctrl+C no terminal)
npm run dev  # Inicie novamente
```

**O Next.js só carrega variáveis de ambiente na inicialização!**

## 🔍 Como Verificar

Após reiniciar o servidor, você deve ver:

**✅ Se estiver OK:**
- Nenhum aviso sobre variáveis faltando
- Terminal mostra logs de autenticação normais

**❌ Se ainda mostrar erro:**
- Verifique se adicionou `SUPABASE_SERVICE_ROLE_KEY`
- Verifique se não há espaços extras nas keys
- Certifique-se de que o servidor foi realmente reiniciado

## 📝 Checklist

- [ ] Adicionar `SUPABASE_SERVICE_ROLE_KEY` no `.env.local`
- [ ] Verificar se `FISH_AUDIO_API_KEY` está no `.env.local`
- [ ] Verificar se `FISH_AUDIO_API_URL` está no `.env.local`
- [ ] **REINICIAR servidor** (Ctrl+C e depois `npm run dev`)
- [ ] Testar `/voices` novamente

## 🔒 Segurança

✅ **Confirmações:**
- `SUPABASE_SERVICE_ROLE_KEY` - server-side apenas
- `FISH_AUDIO_API_KEY` - server-side apenas
- `.env.local` no `.gitignore` - não vai pro Git
- Frontend nunca vê essas keys

