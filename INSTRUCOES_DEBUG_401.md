# 🔍 Como Debuggar o Erro 401 no Upload

## ❌ Problema

Você está recebendo `401 (Unauthorized)` ao tentar fazer upload de áudio.

## 🔍 Como Debuggar

### 1. Verificar Console do Navegador (F12)

Abra o console do navegador (F12 → Console) e procure por:

**✅ Se estiver OK:**
```
✅ Token encontrado, enviando no header
📤 Fazendo upload de áudio...
📥 Resposta recebida: 200 OK
```

**❌ Se tiver problema:**
```
❌ Erro ao obter sessão: ...
❌ Sessão não tem access_token
```

### 2. Verificar Terminal do Servidor

No terminal onde está rodando `npm run dev`, procure por:

**✅ Se estiver OK:**
```
🔍 Tentando autenticação via header Authorization: Presente
🔑 Token encontrado no header, validando...
✅ Usuário autenticado via token no header: <user-id>
✅ Usuário autenticado: <user-id>
```

**❌ Se tiver problema:**
```
❌ Erro de autenticação: ...
📋 Cookies: Ausentes
📋 Authorization header: Ausente
```

## 🚀 Soluções

### Solução 1: Faça Logout e Login Novamente

1. Vá para `/logout` ou clique em "Sair"
2. Faça login novamente
3. Tente fazer upload novamente

### Solução 2: Verificar Sessão

No console do navegador (F12), digite:

```javascript
// Verificar se está autenticado
const { data: { session } } = await supabase.auth.getSession()
console.log('Sessão:', session)
console.log('Access Token:', session?.access_token ? 'Tem token' : 'Sem token')
```

**✅ Se mostrar `Access Token: Tem token`:** A sessão está OK  
**❌ Se mostrar `Access Token: Sem token`:** Faça login novamente

### Solução 3: Verificar Cookies

No console do navegador (F12), digite:

```javascript
// Verificar cookies
document.cookie.split(';').filter(c => c.includes('sb-')).forEach(c => console.log(c))
```

**✅ Se mostrar cookies:** Cookies estão presentes  
**❌ Se não mostrar nada:** Faça login novamente

## 📋 Checklist

- [ ] Console do navegador não mostra erros de sessão
- [ ] Terminal do servidor mostra "Usuário autenticado"
- [ ] Fez logout e login novamente
- [ ] Cookies estão presentes
- [ ] Token está sendo enviado no header

## 🎯 Próximos Passos

1. Abra o console do navegador (F12)
2. Tente fazer upload
3. Veja os logs no console
4. Veja os logs no terminal do servidor
5. Me envie os logs se ainda der erro

**O código já está corrigido! Só precisa verificar a sessão!** 🚀

