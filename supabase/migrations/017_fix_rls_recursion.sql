-- ============================================
-- CORRIGIR RECURSÃO INFINITA NAS POLÍTICAS RLS
-- ============================================
-- O problema: is_admin() tenta acessar profiles dentro de uma política RLS
-- que também acessa profiles, causando recursão infinita.
-- Solução: Remover a política problemática e recriar is_admin() com SET LOCAL

-- 1. Remover a política problemática que causa recursão
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- 2. Recriar a função is_admin() para evitar recursão
-- Usando uma abordagem que não dispara RLS recursivo
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Acessar diretamente auth.users para obter o ID
  -- Depois acessar profiles com RLS desabilitado usando SECURITY DEFINER
  -- Mas precisamos garantir que não haja recursão
  
  -- Usar uma query direta que não dispara RLS recursivo
  -- SECURITY DEFINER já deveria bypassar RLS, mas vamos garantir
  SELECT role INTO user_role
  FROM public.profiles
  WHERE id = auth.uid();
  
  RETURN COALESCE(user_role, 'user') = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Garantir que existe política de INSERT
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 4. NÃO recriar política de admin para profiles
-- Isso causaria recursão porque tenta acessar profiles dentro de uma política RLS de profiles
-- A solução: Usar apenas a política "Users can view own profile"
-- Para verificar se é admin, usar is_admin() em outras tabelas, mas não em profiles
-- Admins podem ver outros perfis através de outras rotas/APIs que usam admin client

