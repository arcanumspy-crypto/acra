-- ============================================
-- Definir usuários como admin
-- ============================================

-- Atualizar o perfil do usuário para admin baseado no email
UPDATE profiles
SET role = 'admin'
WHERE id IN (
  SELECT id FROM auth.users 
  WHERE email IN (
    'emenmurromua@gmail.com',
    'emenjoseph7+conta2@gmail.com'
  )
);

-- Se o perfil não existir, criar com role admin
INSERT INTO profiles (id, name, email, role)
SELECT 
  u.id,
  COALESCE(u.raw_user_meta_data->>'name', u.email),
  u.email,
  'admin'
FROM auth.users u
WHERE u.email IN (
  'emenmurromua@gmail.com',
  'emenjoseph7+conta2@gmail.com'
)
  AND NOT EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = u.id
  )
ON CONFLICT (id) DO UPDATE
SET 
  role = 'admin',
  email = COALESCE(profiles.email, EXCLUDED.email);

-- Verificar se foram atualizados
SELECT 
  p.id,
  p.name,
  p.email,
  p.role,
  u.email as auth_email
FROM profiles p
LEFT JOIN auth.users u ON p.id = u.id
WHERE u.email IN (
  'emenmurromua@gmail.com',
  'emenjoseph7+conta2@gmail.com'
)
ORDER BY u.email;

