-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE offer_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE offer_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

-- ============================================
-- HELPER FUNCTION: CHECK IF USER IS ADMIN
-- ============================================
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PROFILES POLICIES
-- ============================================
-- Users can view and update their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (is_admin());

-- ============================================
-- PLANS POLICIES
-- ============================================
-- Everyone can view active plans
CREATE POLICY "Anyone can view active plans"
  ON plans FOR SELECT
  USING (is_active = true);

-- Only admins can manage plans
CREATE POLICY "Admins can manage plans"
  ON plans FOR ALL
  USING (is_admin());

-- ============================================
-- SUBSCRIPTIONS POLICIES
-- ============================================
-- Users can view their own subscription
CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all subscriptions
CREATE POLICY "Admins can view all subscriptions"
  ON subscriptions FOR SELECT
  USING (is_admin());

-- Users can insert their own subscription (for upgrades)
CREATE POLICY "Users can insert own subscription"
  ON subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can manage all subscriptions
CREATE POLICY "Admins can manage subscriptions"
  ON subscriptions FOR ALL
  USING (is_admin());

-- ============================================
-- CATEGORIES POLICIES
-- ============================================
-- Authenticated users can view categories
CREATE POLICY "Authenticated users can view categories"
  ON categories FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can manage categories
CREATE POLICY "Admins can manage categories"
  ON categories FOR ALL
  USING (is_admin());

-- ============================================
-- OFFERS POLICIES
-- ============================================
-- Authenticated users can view active offers
CREATE POLICY "Authenticated users can view active offers"
  ON offers FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Only admins can manage offers
CREATE POLICY "Admins can manage offers"
  ON offers FOR ALL
  USING (is_admin());

-- ============================================
-- OFFER_ASSETS POLICIES
-- ============================================
-- Authenticated users can view assets of active offers
CREATE POLICY "Authenticated users can view offer assets"
  ON offer_assets FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM offers
      WHERE offers.id = offer_assets.offer_id
      AND offers.is_active = true
    )
  );

-- Only admins can manage assets
CREATE POLICY "Admins can manage offer assets"
  ON offer_assets FOR ALL
  USING (is_admin());

-- ============================================
-- FAVORITES POLICIES
-- ============================================
-- Users can view their own favorites
CREATE POLICY "Users can view own favorites"
  ON favorites FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own favorites
CREATE POLICY "Users can insert own favorites"
  ON favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own favorites
CREATE POLICY "Users can update own favorites"
  ON favorites FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own favorites
CREATE POLICY "Users can delete own favorites"
  ON favorites FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- OFFER_VIEWS POLICIES
-- ============================================
-- Users can view their own views
CREATE POLICY "Users can view own views"
  ON offer_views FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own views
CREATE POLICY "Users can insert own views"
  ON offer_views FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- SEARCH_HISTORY POLICIES
-- ============================================
-- Users can view their own search history
CREATE POLICY "Users can view own search history"
  ON search_history FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own search history
CREATE POLICY "Users can insert own search history"
  ON search_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own search history
CREATE POLICY "Users can delete own search history"
  ON search_history FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- TESTIMONIALS POLICIES
-- ============================================
-- Everyone can view active testimonials
CREATE POLICY "Anyone can view active testimonials"
  ON testimonials FOR SELECT
  USING (is_active = true);

-- Only admins can manage testimonials
CREATE POLICY "Admins can manage testimonials"
  ON testimonials FOR ALL
  USING (is_admin());


