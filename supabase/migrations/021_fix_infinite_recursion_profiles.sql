-- ============================================
-- FIX INFINITE RECURSION IN PROFILES RLS
-- Migration 021: Corrigir recursão infinita nas políticas RLS do profiles
-- ============================================

-- O problema: A função is_admin() causa recursão porque ela lê de profiles
-- que também usa is_admin() nas políticas, criando um loop infinito.

-- Solução: Modificar is_admin() para usar SECURITY DEFINER e ler diretamente
-- sem passar pelas políticas RLS, e garantir que não haja dependências circulares.

-- ============================================
-- 1. RECRIAR FUNÇÃO is_admin() SEM RECURSÃO
-- ============================================
-- IMPORTANTE: Esta função deve usar SECURITY DEFINER e ler diretamente
-- da tabela public.profiles sem passar pelas políticas RLS
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
  user_id UUID;
BEGIN
  -- Obter o ID do usuário autenticado
  user_id := auth.uid();
  
  -- Se não houver usuário autenticado, retornar false
  IF user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Usar SECURITY DEFINER para ler diretamente da tabela sem passar por RLS
  -- IMPORTANTE: Especificar o schema 'public' explicitamente para evitar ambiguidade
  SELECT role INTO user_role
  FROM public.profiles
  WHERE id = user_id;
  
  -- Retornar true apenas se o role for exatamente 'admin'
  RETURN COALESCE(user_role = 'admin', false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================
-- 2. GARANTIR POLÍTICA DE INSERT PARA PROFILES
-- ============================================
-- Permitir que usuários criem seu próprio perfil
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- A política de INSERT já existe acima ("Users can insert own profile")
-- Não precisamos de uma política separada para service role porque
-- o trigger usa SECURITY DEFINER que bypassa RLS

-- ============================================
-- 3. GARANTIR QUE AS POLÍTICAS NÃO CAUSEM RECURSÃO
-- ============================================
-- Remover e recriar as políticas de SELECT para evitar recursão
-- IMPORTANTE: A função is_admin() já foi corrigida acima para usar SECURITY DEFINER
-- e ler diretamente sem passar por RLS, então podemos usá-la com segurança
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (is_admin());

-- Manter a política de visualização do próprio perfil (não causa recursão)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- ============================================
-- 4. ATUALIZAR FUNÇÃO ensure_profile() SE EXISTIR
-- ============================================
CREATE OR REPLACE FUNCTION ensure_profile()
RETURNS profiles AS $$
DECLARE
  user_id UUID;
  user_email TEXT;
  user_name TEXT;
  existing_profile profiles;
BEGIN
  user_id := auth.uid();
  
  IF user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- Tentar buscar perfil existente usando SECURITY DEFINER (bypassa RLS)
  -- IMPORTANTE: Especificar public.profiles explicitamente
  SELECT * INTO existing_profile
  FROM public.profiles
  WHERE id = user_id;
  
  -- Se existe, retornar
  IF existing_profile IS NOT NULL THEN
    RETURN existing_profile;
  END IF;
  
  -- Se não existe, criar
  -- Buscar informações do usuário do auth.users
  SELECT 
    email,
    COALESCE(raw_user_meta_data->>'name', SPLIT_PART(email, '@', 1), 'User')
  INTO user_email, user_name
  FROM auth.users
  WHERE id = user_id;
  
  -- Determinar role (admin para email específico, user para outros)
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    user_id, 
    COALESCE(user_name, 'User'), 
    user_email, 
    CASE 
      WHEN user_email = 'emenmurromua@gmail.com' THEN 'admin'
      ELSE 'user'
    END
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    name = COALESCE(profiles.name, EXCLUDED.name),
    email = COALESCE(profiles.email, EXCLUDED.email),
    role = COALESCE(profiles.role, EXCLUDED.role)
  RETURNING * INTO existing_profile;
  
  RETURN existing_profile;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. ATUALIZAR TRIGGER handle_new_user()
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', SPLIT_PART(NEW.email, '@', 1), 'User'),
    NEW.email,
    CASE 
      WHEN NEW.email = 'emenmurromua@gmail.com' THEN 'admin'
      ELSE 'user'
    END
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    name = COALESCE(profiles.name, EXCLUDED.name),
    email = COALESCE(profiles.email, EXCLUDED.email),
    role = COALESCE(profiles.role, EXCLUDED.role);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

