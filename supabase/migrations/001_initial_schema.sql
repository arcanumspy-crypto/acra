-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE user_role AS ENUM ('user', 'admin');
CREATE TYPE subscription_status AS ENUM ('trial', 'active', 'past_due', 'canceled');
CREATE TYPE asset_type AS ENUM ('vsl_page', 'vsl_script', 'copy', 'creatives', 'screenshot', 'other');

-- ============================================
-- 1. PROFILES TABLE
-- ============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'user',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 2. PLANS TABLE
-- ============================================
CREATE TABLE plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  price_monthly_cents INTEGER NOT NULL DEFAULT 0,
  max_offers_visible INTEGER, -- NULL = unlimited
  max_favorites INTEGER, -- NULL = unlimited
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 3. SUBSCRIPTIONS TABLE
-- ============================================
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE RESTRICT,
  status subscription_status NOT NULL DEFAULT 'trial',
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  current_period_end TIMESTAMPTZ NOT NULL,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id) -- One active subscription per user
);

-- ============================================
-- 4. CATEGORIES TABLE
-- ============================================
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  emoji TEXT,
  description TEXT,
  is_premium BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 5. OFFERS TABLE
-- ============================================
CREATE TABLE offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  short_description TEXT,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  country TEXT NOT NULL,
  funnel_type TEXT NOT NULL, -- 'vsl', 'advertorial', 'longform', 'quiz'
  temperature TEXT NOT NULL, -- 'hot', 'validated', 'testing'
  niche TEXT, -- e.g., 'Emagrecimento', 'Finanças'
  product_type TEXT, -- e.g., 'PLR', 'Nutra'
  main_url TEXT NOT NULL,
  conversion_rate DECIMAL(5,2), -- e.g., 2.5 for 2.5%
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- ============================================
-- 6. OFFER_ASSETS TABLE
-- ============================================
CREATE TABLE offer_assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  offer_id UUID NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
  asset_type asset_type NOT NULL,
  storage_url TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 7. FAVORITES TABLE
-- ============================================
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  offer_id UUID NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
  personal_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, offer_id)
);

-- ============================================
-- 8. OFFER_VIEWS TABLE
-- ============================================
CREATE TABLE offer_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  offer_id UUID NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_plan_snapshot TEXT
);

-- ============================================
-- 9. SEARCH_HISTORY TABLE
-- ============================================
CREATE TABLE search_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  filters JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 10. TESTIMONIALS TABLE
-- ============================================
CREATE TABLE testimonials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  youtube_url TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_plan_id ON subscriptions(plan_id);
CREATE INDEX idx_offers_category_id ON offers(category_id);
CREATE INDEX idx_offers_created_by ON offers(created_by);
CREATE INDEX idx_offers_is_active ON offers(is_active);
CREATE INDEX idx_offer_assets_offer_id ON offer_assets(offer_id);
CREATE INDEX idx_favorites_user_id ON favorites(user_id);
CREATE INDEX idx_favorites_offer_id ON favorites(offer_id);
CREATE INDEX idx_offer_views_user_id ON offer_views(user_id);
CREATE INDEX idx_offer_views_offer_id ON offer_views(offer_id);
CREATE INDEX idx_offer_views_viewed_at ON offer_views(viewed_at);
CREATE INDEX idx_search_history_user_id ON search_history(user_id);
CREATE INDEX idx_search_history_created_at ON search_history(created_at);
CREATE INDEX idx_testimonials_is_active ON testimonials(is_active);
CREATE INDEX idx_testimonials_position ON testimonials(position);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_offers_updated_at BEFORE UPDATE ON offers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FUNCTION TO CREATE PROFILE ON USER SIGNUP
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    'user'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


