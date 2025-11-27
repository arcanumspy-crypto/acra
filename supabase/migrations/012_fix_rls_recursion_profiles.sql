-- ============================================
-- CORRIGIR RECURSÃO INFINITA NAS POLÍTICAS RLS
-- ============================================

-- O problema: A função is_admin() faz SELECT na tabela profiles,
-- mas a política "Admins can view all profiles" também usa is_admin(),
-- causando recursão infinita.

-- SOLUÇÃO DEFINITIVA: Usar uma função SECURITY DEFINER que lê diretamente
-- da tabela profiles sem passar pelas políticas RLS, e usar essa função
-- nas políticas de forma que não cause recursão.

-- Remover todas as políticas existentes para recriar
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Criar função que verifica role do usuário atual SEM passar por RLS
-- Esta função usa SECURITY DEFINER para ler diretamente da tabela
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS TEXT AS $$
DECLARE
  user_role_val TEXT;
BEGIN
  -- SECURITY DEFINER permite ler diretamente sem passar por RLS
  -- Isso evita recursão porque a função não é afetada pelas políticas
  SELECT role::TEXT INTO user_role_val
  FROM profiles
  WHERE id = auth.uid();
  
  RETURN COALESCE(user_role_val, 'user');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Recriar is_admin() usando a função auxiliar
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN get_current_user_role() = 'admin';
END;
$$ LANGUAGE plpgsql STABLE;

-- Política 1: Usuários podem ver seu próprio perfil
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Política 2: Usuários podem inserir seu próprio perfil (para handle_new_user)
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Política 3: Usuários podem atualizar seu próprio perfil
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Política 4: Admins podem ver todos os perfis
-- Usa get_current_user_role() que tem SECURITY DEFINER e não causa recursão
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (get_current_user_role() = 'admin');

-- Política 5: Admins podem atualizar todos os perfis
CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  USING (get_current_user_role() = 'admin');

