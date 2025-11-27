# Configuração de Variáveis de Ambiente

## ⚠️ IMPORTANTE: Configure as variáveis do Supabase

Para que a aplicação funcione, você precisa criar um arquivo `.env.local` na raiz do projeto com as credenciais do Supabase.

## 📝 Passo a Passo

### 1. Obter Credenciais do Supabase

1. Acesse seu projeto no [Supabase Dashboard](https://app.supabase.com)
2. Vá em **Settings** → **API**
3. Copie os seguintes valores:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** (opcional, apenas para admin) → `SUPABASE_SERVICE_ROLE_KEY`

### 2. Criar arquivo `.env.local`

Na raiz do projeto, crie um arquivo chamado `.env.local` com o seguinte conteúdo:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-aqui

# Opcional: Service Role Key (apenas para operações admin no servidor)
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key-aqui
```

### 3. Substituir os valores

Substitua:
- `https://seu-projeto.supabase.co` pela URL do seu projeto
- `sua-chave-anon-aqui` pela chave anon do Supabase
- `sua-service-role-key-aqui` pela service role key (se necessário)

### 4. Reiniciar o servidor

Após criar o arquivo `.env.local`, **reinicie o servidor de desenvolvimento**:

```bash
# Pare o servidor (Ctrl+C) e inicie novamente
npm run dev
```

## 🔒 Segurança

- ⚠️ **NUNCA** commite o arquivo `.env.local` no Git
- O arquivo `.env.local` já está no `.gitignore`
- Use `.env.example` como template para documentação

## ✅ Verificação

Após configurar, você deve ver:
- ✅ Sem erros de "Missing Supabase environment variables"
- ✅ A aplicação carrega normalmente
- ✅ Login e signup funcionam

## 🆘 Problemas Comuns

### Erro: "Missing Supabase environment variables"
- Verifique se o arquivo `.env.local` existe na raiz do projeto
- Verifique se os nomes das variáveis estão corretos (com `NEXT_PUBLIC_` prefix)
- Reinicie o servidor após criar/editar o arquivo

### Erro: "Invalid API key"
- Verifique se copiou a chave correta do Supabase
- Verifique se não há espaços extras ou caracteres inválidos

### Ainda não funciona?
- Certifique-se de que executou as migrações SQL no Supabase
- Verifique se o projeto do Supabase está ativo
- Verifique os logs do console do navegador para mais detalhes


