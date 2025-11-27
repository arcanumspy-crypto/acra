# 🔧 Correção do Erro 401 (Unauthorized)

## ❌ Problema

Erro 401 ao acessar as rotas de API `/api/voices/list` e `/api/voices/create-voice`:

```
Failed to load resource: the server responded with a status of 401 (Unauthorized)
```

## 🔍 Causa

O `createClient()` do Supabase server não estava conseguindo ler os cookies da sessão do usuário. No Next.js 14 App Router, precisamos usar `@supabase/ssr` para criar um cliente que leia corretamente os cookies da requisição HTTP.

## ✅ Solução Implementada

### 1. Atualizado `src/lib/supabase/server.ts`

Mudei de `createClient` do `@supabase/supabase-js` para `createServerClient` do `@supabase/ssr`:

**Antes:**
```typescript
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export async function createClient() {
  return createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })
}
```

**Depois:**
```typescript
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options })
        } catch (error) {
          // Ignorado em API routes
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: '', ...options })
        } catch (error) {
          // Ignorado em API routes
        }
      },
    },
  })
}
```

### 2. Adicionado `credentials: 'include'` nas requisições fetch

Atualizei todas as chamadas fetch na página `/voices` para incluir cookies:

```typescript
const response = await fetch('/api/voices/list', {
  credentials: 'include', // ✅ Incluir cookies na requisição
})
```

## 🧪 Como Testar

1. **Reinicie o servidor Next.js**:
   ```bash
   npm run dev
   ```

2. **Faça login na plataforma**:
   - Acesse `http://localhost:3000/login`
   - Faça login com suas credenciais

3. **Teste a página de vozes**:
   - Acesse `http://localhost:3000/voices`
   - A lista de vozes deve carregar sem erro 401

4. **Teste o upload de áudio**:
   - Faça upload de um arquivo de áudio
   - Não deve mais retornar erro 401

## 📝 Notas

- O `@supabase/ssr` já estava instalado no projeto (versão 0.7.0)
- Esta é a forma recomendada de usar Supabase no Next.js 14 App Router
- Os cookies são lidos automaticamente do `next/headers`

## 🔄 Próximos Passos

Após corrigir o erro 401:
1. ✅ Testar se a autenticação funciona
2. ✅ Testar upload de áudio
3. ✅ Testar listagem de vozes
4. ✅ Testar geração de TTS

