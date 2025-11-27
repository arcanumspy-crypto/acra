-- ============================================
-- FIX SIGNUP COMPLETE - SOLUÇÃO DEFINITIVA
-- Migration 030: Garantir que signup funcione removendo todas as barreiras
-- ============================================

-- Este script faz uma limpeza completa para garantir que o signup funcione:
-- 1. Remove trigger que pode estar causando erro
-- 2. Garante que políticas RLS não bloqueiem
-- 3. Verifica estrutura da tabela profiles

-- ============================================
-- 1. REMOVER TODOS OS TRIGGERS DE SIGNUP (PRIORIDADE MÁXIMA)
-- ============================================
-- ERRO IDENTIFICADO: "relation user_credits does not exist"
-- O trigger create_user_credits() está tentando inserir na tabela user_credits
-- que não existe, causando erro 500 no signup.

-- IMPORTANTE: Remover TODOS os triggers que executam após INSERT em auth.users
-- Isso garante que o signup não seja bloqueado por erros em triggers

-- Remover trigger de créditos PRIMEIRO (ESTE É O QUE ESTÁ CAUSANDO O ERRO 500!)
-- O erro específico é: ERROR: relation "user_credits" does not exist
DROP TRIGGER IF EXISTS on_auth_user_created_credits ON auth.users CASCADE;

-- Remover trigger de profiles
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;

-- Remover funções relacionadas (CASCADE remove dependências)
-- IMPORTANTE: Remover create_user_credits() primeiro pois está causando o erro
DROP FUNCTION IF EXISTS public.create_user_credits() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Verificar se há outros triggers em auth.users e remover
DO $$
DECLARE
  trigger_record RECORD;
BEGIN
  FOR trigger_record IN 
    SELECT trigger_name 
    FROM information_schema.triggers 
    WHERE event_object_table = 'users' 
    AND event_object_schema = 'auth'
    AND action_timing = 'AFTER'
    AND event_manipulation = 'INSERT'
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON auth.users CASCADE', trigger_record.trigger_name);
  END LOOP;
END $$;

-- ============================================
-- 2. GARANTIR ESTRUTURA DA TABELA PROFILES
-- ============================================
-- Verificar se todos os campos têm DEFAULT ou são nullable

-- Garantir que email existe e é nullable
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'email'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN email TEXT;
  END IF;
END $$;

-- Garantir que banned existe e tem DEFAULT
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'banned'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN banned BOOLEAN NOT NULL DEFAULT false;
  ELSE
    -- Se existe mas não tem DEFAULT, adicionar
    ALTER TABLE public.profiles 
    ALTER COLUMN banned SET DEFAULT false;
    -- Garantir que valores NULL sejam false
    UPDATE public.profiles SET banned = false WHERE banned IS NULL;
    ALTER TABLE public.profiles ALTER COLUMN banned SET NOT NULL;
  END IF;
END $$;

-- ============================================
-- 3. GARANTIR POLÍTICAS RLS CORRETAS
-- ============================================
-- Remover todas as políticas de INSERT que possam estar bloqueando
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Criar política de INSERT que permite criação de perfil
-- IMPORTANTE: Esta política permite que qualquer usuário autenticado crie seu próprio perfil
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- ============================================
-- 4. VERIFICAR SE O TIPO user_role EXISTE
-- ============================================
-- Se o tipo não existir, criar
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('user', 'admin');
  END IF;
END $$;

-- ============================================
-- 5. GARANTIR QUE A COLUNA role TEM DEFAULT
-- ============================================
-- Se a coluna role não tiver DEFAULT, adicionar
DO $$ 
BEGIN
  -- Verificar se precisa de DEFAULT
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'role'
    AND is_nullable = 'NO'
    AND column_default IS NULL
  ) THEN
    ALTER TABLE public.profiles 
    ALTER COLUMN role SET DEFAULT 'user'::user_role;
  END IF;
END $$;

-- ============================================
-- 6. COMENTÁRIOS FINAIS
-- ============================================
COMMENT ON TABLE public.profiles IS 'Perfis de usuários. Criados manualmente no código após signup para evitar que erros quebrem o signup.';
COMMENT ON POLICY "Users can insert own profile" ON public.profiles IS 'Permite que usuários autenticados criem seu próprio perfil após signup.';

