# 🔧 Como Configurar o .env.local - PASSO A PASSO

## ❌ Problemas Identificados

1. ❌ `SUPABASE_SERVICE_ROLE_KEY` não configurada → Erro 500 no `/api/voices/list`
2. ❌ `FISH_AUDIO_API_KEY` não configurada → Erro no upload de áudio

## ✅ SOLUÇÃO RÁPIDA

### Passo 1: Abrir o arquivo `.env.local`

Localização: `c:\Users\PRECISION\Downloads\ej-swipefile\.env.local`

### Passo 2: Adicionar as variáveis faltando

Abra o arquivo `.env.local` e **adicione** essas linhas:

```env
# Supabase Service Role Key (obtenha em: https://app.supabase.com/project/vahqjpblgirjbhglsiqm/settings/api)
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui

# Fish Audio API (server-side apenas - NUNCA expor no frontend!)
FISH_AUDIO_API_KEY=7c0f58472b724703abc385164af007b5
FISH_AUDIO_API_URL=https://api.fish.audio
```

### Passo 3: Arquivo `.env.local` Final Completo

Seu arquivo `.env.local` deve ficar assim:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://vahqjpblgirjbhglsiqm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhaHFqcGJsZ2lyamJoZ2xzaXFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4NTI2MzcsImV4cCI6MjA3OTQyODYzN30.hQ-BjXpzNAQYYbfhx87KYU_ICgAVstHQMyymPXBY6Rk

# Supabase Service Role Key (server-side apenas - NUNCA expor no frontend!)
# Obtenha em: https://app.supabase.com/project/vahqjpblgirjbhglsiqm/settings/api
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui

# Fish Audio API (server-side apenas - NUNCA expor no frontend!)
FISH_AUDIO_API_KEY=7c0f58472b724703abc385164af007b5
FISH_AUDIO_API_URL=https://api.fish.audio
```

## 🔑 Como Obter a SUPABASE_SERVICE_ROLE_KEY

1. Acesse: https://app.supabase.com/project/vahqjpblgirjbhglsiqm/settings/api
2. Role até a seção **"Project API keys"**
3. Copie a **"service_role" key** (a secret key, não a anon key!)
4. Cole no `.env.local` como:

```env
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (sua key aqui)
```

⚠️ **IMPORTANTE:** Esta é a **secret key** (service_role), não a anon key!

## ⚠️ CRÍTICO: Reinicie o Servidor

Após adicionar as variáveis no `.env.local`:

1. **Pare o servidor** (Ctrl+C no terminal onde está rodando)
2. **Inicie novamente**:

```bash
npm run dev
```

**O Next.js só carrega variáveis de ambiente na inicialização!**

## ✅ Verificar se Funcionou

Após reiniciar o servidor, você deve ver:

**✅ Se estiver OK:**
- Terminal não mostra avisos sobre variáveis faltando
- `/api/voices/list` retorna 200 (não mais 500)
- Upload de áudio funciona

**❌ Se ainda mostrar erro:**
- Verifique se adicionou todas as variáveis
- Verifique se não há espaços extras nas keys
- Certifique-se de que o servidor foi realmente reiniciado

## 📋 Checklist

- [ ] Adicionar `SUPABASE_SERVICE_ROLE_KEY` no `.env.local`
- [ ] Adicionar `FISH_AUDIO_API_KEY=7c0f58472b724703abc385164af007b5` no `.env.local`
- [ ] Adicionar `FISH_AUDIO_API_URL=https://api.fish.audio` no `.env.local`
- [ ] **REINICIAR servidor** (Ctrl+C e depois `npm run dev`)
- [ ] Testar `/voices` novamente

## 🔒 Segurança Confirmada

✅ **Arquitetura Segura:**
- `SUPABASE_SERVICE_ROLE_KEY` - server-side apenas
- `FISH_AUDIO_API_KEY` - server-side apenas
- `.env.local` no `.gitignore` - não vai pro Git
- Frontend nunca vê essas keys

## 🧪 Teste Rápido

Após configurar e reiniciar:

1. Acesse `http://localhost:3001/voices`
2. Verifique o console do navegador (F12) - não deve ter erros
3. Verifique o terminal do servidor - deve mostrar logs normais

Se ainda houver problemas, me avise! 🚀

