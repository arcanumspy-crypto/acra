-- Adicionar campo email na tabela profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS email TEXT;

-- Atualizar emails existentes a partir de auth.users
UPDATE profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND (p.email IS NULL OR p.email = '');

-- Criar índice para busca por email
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Atualizar função handle_new_user para salvar email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email,
    'user'
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = COALESCE(profiles.email, NEW.email),
    name = COALESCE(profiles.name, COALESCE(NEW.raw_user_meta_data->>'name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

