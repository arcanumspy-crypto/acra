-- ============================================
-- ENSURE NICHES TABLE EXISTS
-- Migration 017: Garantir que a tabela niches existe
-- ============================================

-- Create niches table if it doesn't exist
CREATE TABLE IF NOT EXISTS niches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_niches_category_id ON niches(category_id);
CREATE INDEX IF NOT EXISTS idx_niches_is_active ON niches(is_active);
CREATE INDEX IF NOT EXISTS idx_niches_slug ON niches(slug);

-- Enable RLS if not already enabled
ALTER TABLE niches ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Authenticated users can view active niches" ON niches;
DROP POLICY IF EXISTS "Admins can view all niches" ON niches;
DROP POLICY IF EXISTS "Admins can manage niches" ON niches;

-- Create RLS policies for niches
CREATE POLICY "Authenticated users can view active niches"
  ON niches FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can view all niches"
  ON niches FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can manage niches"
  ON niches FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());


