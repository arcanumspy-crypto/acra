# 📦 Como Configurar o Bucket no Supabase Storage

## ⚠️ IMPORTANTE

Para que o upload de áudios funcione, você precisa criar um bucket no Supabase Storage.

## 📝 Passo a Passo

### 1. Acessar o Supabase Dashboard

1. Vá para [app.supabase.com](https://app.supabase.com)
2. Selecione seu projeto

### 2. Criar o Bucket

1. No menu lateral, clique em **Storage**
2. Clique no botão **New bucket**
3. Configure:
   - **Name:** `voice-clones`
   - **Public bucket:** ❌ **NÃO** (deixe desmarcado - privado)
   - Clique em **Create bucket**

### 3. Configurar Políticas (RLS)

Após criar o bucket, você precisa configurar as políticas para permitir que usuários autenticados façam upload:

1. No bucket `voice-clones`, vá em **Policies**
2. Clique em **New Policy** → **Create policy from scratch**
3. Configure:
   - **Policy name:** `Users can upload their own voice clones`
   - **Allowed operation:** SELECT, INSERT
   - **Policy definition:** 
     ```sql
     (bucket_id = 'voice-clones'::text) AND (auth.uid()::text = (storage.foldername(name))[1])
     ```
   - Clique em **Review** e depois **Save policy**

Ou execute no SQL Editor do Supabase:

```sql
-- Permitir que usuários autenticados façam upload de seus próprios arquivos
CREATE POLICY "Users can upload their own voice clones"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'voice-clones' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Permitir que usuários autenticados leiam seus próprios arquivos
CREATE POLICY "Users can read their own voice clones"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'voice-clones' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

### 4. Verificar

Após criar o bucket, tente fazer upload novamente. O erro "Bucket não encontrado" deve desaparecer.

## ✅ Status

- ✅ Bucket criado: `voice-clones`
- ✅ Políticas configuradas
- ✅ Pronto para usar!

**Depois de configurar, teste o upload novamente!** 🚀

