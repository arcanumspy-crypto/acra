# 📋 Plano de Implementação - Histórico e Teste de Voz

## ✅ Funcionalidades a Implementar

### 1. Histórico de Narrações ✅

**O que será feito:**
- Criar endpoint para buscar histórico (`/api/voices/history`) ✅ JÁ CRIADO
- Adicionar seção de histórico na página `/voices`
- Listar todas as narrações geradas
- Permitir reproduzir, baixar e deletar

**Implementação:**
- Adicionar estado `narrations` na página
- Criar função `loadHistory()` 
- Adicionar seção visual de histórico

### 2. Teste de Voz Durante o Clone ✅

**O que será feito:**
- Adicionar campo "Texto de Teste (opcional)" no formulário de upload
- Após upload, se tiver texto de teste, gerar narração automaticamente
- Mostrar player de teste
- Botões: "Aprovar e Salvar Voz", "Regenerar Teste", "Descartar"
- Só salvar no banco quando aprovar

**Implementação:**
- Modificar formulário de upload para incluir campo de teste
- Modificar `handleUpload` para gerar teste após upload
- Criar estado para gerenciar fluxo de teste
- Adicionar modal/painel de teste com player
- Criar endpoint para aprovar voz (`/api/voices/[id]/approve`)

## 🚀 Próximo Passo

Vou atualizar a página `/voices` com essas funcionalidades agora!

