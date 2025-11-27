-- ============================================
-- CREATE COMMUNITIES AND COMMUNITY_MEMBERS TABLES
-- ============================================

-- Create communities table
CREATE TABLE IF NOT EXISTS public.communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  is_paid BOOLEAN NOT NULL DEFAULT false,
  join_link TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create community_members table (junction table)
CREATE TABLE IF NOT EXISTS public.community_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, community_id) -- Prevent duplicate memberships
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_community_members_user_id ON public.community_members(user_id);
CREATE INDEX IF NOT EXISTS idx_community_members_community_id ON public.community_members(community_id);
CREATE INDEX IF NOT EXISTS idx_communities_is_active ON public.communities(is_active);

-- Enable Row Level Security
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for communities
-- Drop existing policies if they exist (idempotent)
DROP POLICY IF EXISTS "Anyone can view active communities" ON public.communities;
DROP POLICY IF EXISTS "Admins can view all communities" ON public.communities;
DROP POLICY IF EXISTS "Admins can manage all communities" ON public.communities;

-- Anyone can view active communities
CREATE POLICY "Anyone can view active communities"
  ON public.communities
  FOR SELECT
  USING (is_active = true);

-- Admins can view all communities
CREATE POLICY "Admins can view all communities"
  ON public.communities
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins can manage all communities
CREATE POLICY "Admins can manage all communities"
  ON public.communities
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- RLS Policies for community_members
-- Drop existing policies if they exist (idempotent)
DROP POLICY IF EXISTS "Users can view their own memberships" ON public.community_members;
DROP POLICY IF EXISTS "Users can join communities" ON public.community_members;
DROP POLICY IF EXISTS "Users can leave communities" ON public.community_members;
DROP POLICY IF EXISTS "Admins can view all memberships" ON public.community_members;

-- Users can view their own memberships
CREATE POLICY "Users can view their own memberships"
  ON public.community_members
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can join communities
CREATE POLICY "Users can join communities"
  ON public.community_members
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can leave communities
CREATE POLICY "Users can leave communities"
  ON public.community_members
  FOR DELETE
  USING (auth.uid() = user_id);

-- Admins can view all memberships
CREATE POLICY "Admins can view all memberships"
  ON public.community_members
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_communities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_communities_updated_at_trigger ON public.communities;
CREATE TRIGGER update_communities_updated_at_trigger
  BEFORE UPDATE ON public.communities
  FOR EACH ROW
  EXECUTE FUNCTION update_communities_updated_at();

