# 🚀 Modo Desenvolvimento: Usar Apenas API Key do Fish

## ⚠️ Problema Resolvido

O erro `556 Internal server error` ao validar token do Supabase foi resolvido adicionando um **modo de desenvolvimento** que permite usar apenas a API key do Fish Audio, sem precisar de autenticação do Supabase.

---

## ✅ Como Usar (2 Opções)

### Opção 1: Modo Desenvolvimento (Apenas API Key do Fish)

**1. Configure a variável de ambiente:**
```bash
# .env.local
ALLOW_FISH_API_KEY_ONLY=true
FISH_AUDIO_API_KEY=7c0f58472b724703abc385164af007b5
```

**2. Envie o header `x-fish-api-key` nas requisições:**
```typescript
const response = await fetch('/api/voices/create-voice', {
  method: 'POST',
  headers: {
    'x-fish-api-key': '7c0f58472b724703abc385164af007b5', // ✅ Sua API key do Fish
    // Não precisa de Authorization Bearer token
  },
  body: formData,
})
```

**3. O backend vai:**
- ✅ Validar que a API key do Fish está correta
- ✅ Criar um usuário temporário (`dev-user-{timestamp}`)
- ✅ Processar normalmente sem precisar do Supabase

---

### Opção 2: Modo Normal (Com Autenticação Supabase)

**1. Faça login no Supabase normalmente**

**2. O token será enviado automaticamente via cookies ou header `Authorization`**

**3. O backend vai validar o token do Supabase normalmente**

---

## 🔧 Atualização do Frontend (Opcional)

Se você quiser usar o modo desenvolvimento no frontend, adicione o header:

```typescript
// src/app/(auth)/voices/page.tsx
const headers: HeadersInit = {
  'x-fish-api-key': '7c0f58472b724703abc385164af007b5', // ✅ Adicione isso
}

// OU, se preferir usar variável de ambiente:
const headers: HeadersInit = {
  'x-fish-api-key': process.env.NEXT_PUBLIC_FISH_AUDIO_API_KEY || '', // ⚠️ Cuidado: expõe a key no cliente
}
```

**⚠️ ATENÇÃO:** Se você colocar a API key no frontend, ela ficará visível no código. Para produção, use autenticação Supabase.

---

## 📝 Logs Esperados (Modo Desenvolvimento)

```
🚀 POST /api/voices/create-voice - Iniciando...
🔐 Verificando autenticação...
⚠️ MODO DESENVOLVIMENTO: Usando apenas API key do Fish (sem autenticação Supabase)
   API Key (primeiros 10 chars): 7c0f58472b...
✅ Modo desenvolvimento ativado - API key do Fish válida
📥 Lendo formData...
...
```

---

## 🎯 Vantagens do Modo Desenvolvimento

1. ✅ **Não precisa configurar Supabase** (se você só tem a API key do Fish)
2. ✅ **Teste rápido** sem precisar fazer login
3. ✅ **Funciona imediatamente** com apenas a API key

---

## ⚠️ Desvantagens

1. ❌ **Sem controle de usuário** (todas as vozes ficam com `dev-user-{timestamp}`)
2. ❌ **Não é seguro para produção** (qualquer um com a API key pode usar)
3. ❌ **Sem histórico por usuário** (tudo fica misturado)

---

## 🚀 Para Produção

**SEMPRE use autenticação Supabase em produção!**

1. Configure o Supabase corretamente
2. Remova `ALLOW_FISH_API_KEY_ONLY=true` do `.env.local`
3. Use autenticação normal via cookies/token

---

**Modo desenvolvimento ativado!** ✅ Teste agora enviando o header `x-fish-api-key`.

