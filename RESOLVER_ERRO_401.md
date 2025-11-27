# 🔧 Como Resolver o Erro 401 no Upload

## ❌ Problema

Você está recebendo `401 (Unauthorized)` ao tentar fazer upload de áudio.

## 🔍 Diagnóstico Rápido

### Verificar no Console do Navegador (F12)

Abra o console (F12) e procure por estas mensagens:

**Se aparecer:**
- `❌ Erro ao obter sessão` → Sessão não existe, faça login
- `❌ Sessão não tem access_token` → Sessão inválida, faça login
- `📤 Fazendo upload...` → Código está tentando fazer upload

### Verificar no Terminal do Servidor

No terminal onde está rodando `npm run dev`, procure por:

**Se aparecer:**
- `❌ Erro de autenticação` → Backend não encontrou usuário
- `📋 Authorization header: Ausente` → Token não está sendo enviado
- `✅ Usuário autenticado` → Autenticação funcionou!

## 🚀 Soluções (Tente nesta ordem)

### 1. Faça Logout e Login Novamente

**Passo a passo:**
1. Clique em seu avatar/perfil no canto superior direito
2. Clique em "Sair" ou vá para `/logout`
3. Faça login novamente em `/login`
4. Tente fazer upload novamente

**Por quê?** A sessão pode ter expirado ou estar corrompida.

### 2. Verificar se Está Autenticado

No console do navegador (F12), digite:

```javascript
// Verificar sessão
const { data: { session } } = await supabase.auth.getSession()
console.log('Sessão existe?', !!session)
console.log('Tem token?', !!session?.access_token)
```

**✅ Se ambos mostrarem `true`:** Sessão OK, pode ser outro problema  
**❌ Se algum mostrar `false`:** Faça login novamente

### 3. Verificar Cookies

No console do navegador (F12), digite:

```javascript
// Verificar cookies do Supabase
document.cookie.split(';').filter(c => c.includes('sb-')).forEach(c => console.log(c))
```

**✅ Se mostrar cookies:** Cookies OK  
**❌ Se não mostrar nada:** Faça login novamente

### 4. Limpar Cache e Cookies

1. Pressione `Ctrl+Shift+Delete` (Windows) ou `Cmd+Shift+Delete` (Mac)
2. Selecione "Cookies e outros dados do site"
3. Clique em "Limpar dados"
4. Faça login novamente
5. Tente fazer upload

## 📋 Checklist de Verificação

Antes de tentar fazer upload, verifique:

- [ ] Você está logado (vê seu nome/avatar no topo da página)
- [ ] A página `/voices` carrega sem erros
- [ ] Console do navegador não mostra erros
- [ ] Fez logout e login recentemente

## 🎯 O Que o Código Está Fazendo

1. ✅ Verifica se está autenticado (`isAuthenticated`)
2. ✅ Obtém a sessão do Supabase
3. ✅ Verifica se a sessão tem `access_token`
4. ✅ Envia o token no header `Authorization`
5. ✅ Backend tenta autenticar via cookies ou header

## 🔍 Logs Esperados

### Console do Navegador:
```
✅ Token encontrado, enviando no header
📤 Fazendo upload de áudio...
📥 Resposta recebida: 200 OK
```

### Terminal do Servidor:
```
🔍 Tentando autenticação via header Authorization: Presente
🔑 Token encontrado no header, validando...
✅ Usuário autenticado via token no header: <user-id>
✅ Usuário autenticado: <user-id>
```

## ⚠️ Se Ainda Der Erro 401

Envie-me:
1. **Logs do console do navegador** (F12 → Console)
2. **Logs do terminal do servidor** (onde está rodando `npm run dev`)
3. **O que aparece** quando você tenta fazer upload

## ✅ Status do Código

- ✅ Verificação de autenticação implementada
- ✅ Envio de token no header implementado
- ✅ Logs de debug adicionados
- ✅ Mensagens de erro claras

**O código está correto! Provavelmente é um problema de sessão expirada.** 🚀

**Solução mais provável: Faça logout e login novamente!** ✅

