-- ============================================
-- BLOQUEAR TODOS OS USUÁRIOS SEM PAGAMENTO (EXCETO ADMINS)
-- Execute este script no SQL Editor do Supabase
-- ============================================
-- 
-- ATENÇÃO: Este script bloqueia TODOS os usuários que não têm has_active_subscription = TRUE
-- Exceto admins que têm acesso vitalício

-- PASSO 1: Garantir que a coluna has_active_subscription existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'has_active_subscription'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN has_active_subscription BOOLEAN NOT NULL DEFAULT FALSE;
  END IF;
END $$;

-- PASSO 2: BLOQUEAR TODOS OS USUÁRIOS NÃO-ADMIN QUE NÃO TÊM has_active_subscription = TRUE
-- Isso força que apenas usuários com pagamento válido possam acessar
UPDATE public.profiles
SET 
  has_active_subscription = FALSE,
  updated_at = NOW()
WHERE 
  role != 'admin'  -- NUNCA bloquear admins
  AND (
    has_active_subscription IS NULL 
    OR has_active_subscription = FALSE
    OR has_active_subscription IS NOT TRUE
  );

-- PASSO 3: Cancelar todas as subscriptions de usuários bloqueados
UPDATE public.subscriptions
SET 
  status = 'canceled',
  cancelled_at = NOW(),
  updated_at = NOW()
WHERE 
  user_id IN (
    SELECT id 
    FROM public.profiles 
    WHERE role != 'admin' 
    AND has_active_subscription = FALSE
  )
  AND status IN ('active', 'trial');

-- PASSO 4: Verificar quantos usuários foram bloqueados
SELECT 
  COUNT(*) as total_usuarios,
  COUNT(CASE WHEN role = 'admin' THEN 1 END) as total_admins,
  COUNT(CASE WHEN role != 'admin' AND has_active_subscription = TRUE THEN 1 END) as usuarios_ativos,
  COUNT(CASE WHEN role != 'admin' AND has_active_subscription = FALSE THEN 1 END) as usuarios_bloqueados
FROM public.profiles;

-- PASSO 5: Listar usuários bloqueados (para verificação)
SELECT 
  p.id,
  p.name,
  p.email,
  p.role,
  p.has_active_subscription,
  p.created_at,
  (
    SELECT COUNT(*) 
    FROM public.payments pay 
    WHERE pay.user_id = p.id 
    AND pay.status IN ('completed', 'paid', 'confirmed')
  ) as payments_count,
  (
    SELECT COUNT(*) 
    FROM public.subscriptions s 
    WHERE s.user_id = p.id 
    AND s.status = 'active'
  ) as active_subscriptions_count
FROM public.profiles p
WHERE 
  p.role != 'admin'
  AND p.has_active_subscription = FALSE
ORDER BY p.created_at DESC
LIMIT 50;

-- ============================================
-- NOTAS IMPORTANTES:
-- ============================================
-- 1. Este script bloqueia TODOS os usuários não-admin que não têm has_active_subscription = TRUE
-- 2. Admins são SEMPRE excluídos do bloqueio (acesso vitalício)
-- 3. Usuários bloqueados SÓ podem ser desbloqueados através de um NOVO PAGAMENTO
-- 4. Quando um usuário faz pagamento, o sistema automaticamente define has_active_subscription = TRUE
-- 5. Este script também cancela todas as subscriptions ativas de usuários bloqueados

