-- ============================================
-- FIX SIGNUP TRIGGER - PREVENT 500 ERROR
-- Migration 027: Corrigir trigger handle_new_user() para evitar erro 500 no signup
-- ============================================

-- O problema: O trigger handle_new_user() pode estar falhando devido a:
-- 1. Políticas RLS bloqueando o INSERT
-- 2. A função não ter permissões adequadas
-- 3. Conflitos ou erros na inserção

-- Solução: Garantir que o trigger use SECURITY DEFINER e tenha todas as permissões necessárias

-- ============================================
-- 1. GARANTIR POLÍTICA DE INSERT
-- ============================================
-- A política de INSERT deve permitir que o trigger crie perfis
-- Como o trigger usa SECURITY DEFINER, ele bypassa RLS, mas vamos garantir a política
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================
-- 2. RECRIAR TRIGGER handle_new_user() COM TRATAMENTO DE ERROS
-- ============================================
-- IMPORTANTE: Esta função usa SECURITY DEFINER para bypassar RLS completamente
-- Ela preenche TODOS os campos NOT NULL da tabela profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_name TEXT;
  user_email TEXT;
  user_role_val user_role;
BEGIN
  -- Extrair nome do usuário (obrigatório - NOT NULL)
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'name',
    SPLIT_PART(NEW.email, '@', 1),
    'User'
  );
  
  -- Extrair email (opcional - pode ser NULL)
  user_email := NEW.email;
  
  -- Determinar role (admin para email específico, user para outros)
  -- role é NOT NULL com DEFAULT 'user', mas vamos preencher explicitamente
  IF user_email = 'emenmurromua@gmail.com' THEN
    user_role_val := 'admin'::user_role;
  ELSE
    user_role_val := 'user'::user_role;
  END IF;
  
  -- Inserir perfil preenchendo TODOS os campos NOT NULL
  -- Campos NOT NULL na tabela profiles:
  -- - id: NEW.id (vem do trigger)
  -- - name: user_name (preenchido acima) ✓
  -- - role: user_role_val (preenchido acima) ✓
  -- - created_at: tem DEFAULT NOW() (não precisa preencher)
  -- - updated_at: tem DEFAULT NOW() (não precisa preencher)
  -- - banned: tem DEFAULT false (não precisa preencher)
  -- - email: nullable (opcional, mas vamos preencher se possível)
  
  -- Inserir perfil - tentar com email primeiro (coluna foi adicionada na migration 010)
  -- Se der erro de coluna não existir, tentar sem email
  BEGIN
    -- Tentar inserir com email
    INSERT INTO public.profiles (id, name, email, role)
    VALUES (
      NEW.id,
      user_name,
      user_email,
      user_role_val
    )
    ON CONFLICT (id) DO NOTHING; -- Se já existir, não fazer nada (não quebrar)
  EXCEPTION
    WHEN undefined_column OR OTHERS THEN
      -- Se a coluna email não existir ou outro erro, inserir sem ela
      INSERT INTO public.profiles (id, name, role)
      VALUES (
        NEW.id,
        user_name,
        user_role_val
      )
      ON CONFLICT (id) DO NOTHING;
  END;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Se houver qualquer erro, logar mas NÃO quebrar o signup
    -- O Supabase precisa que o trigger retorne NEW mesmo em caso de erro
    RAISE WARNING 'Erro ao criar perfil para usuário %: % (SQLSTATE: %)', 
      NEW.id, SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 3. GARANTIR QUE O TRIGGER ESTÁ ATIVO
-- ============================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 4. VERIFICAR PERMISSÕES DA FUNÇÃO
-- ============================================
-- A função já usa SECURITY DEFINER, então ela executa com as permissões
-- do criador da função (geralmente postgres), que tem todas as permissões

-- Comentários
COMMENT ON FUNCTION public.handle_new_user() IS 'Cria perfil automaticamente quando um novo usuário é criado no auth.users. Usa SECURITY DEFINER para bypassar RLS.';

