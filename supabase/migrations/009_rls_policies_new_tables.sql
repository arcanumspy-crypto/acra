-- ============================================
-- RLS POLICIES FOR NEW TABLES
-- Migration 009: RLS para novas tabelas
-- ============================================

-- Enable RLS on new tables
ALTER TABLE niches ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;

-- ============================================
-- NICHES POLICIES
-- ============================================
-- Authenticated users can view active niches
CREATE POLICY "Authenticated users can view active niches"
  ON niches FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Admins can view all niches
CREATE POLICY "Admins can view all niches"
  ON niches FOR SELECT
  USING (is_admin());

-- Only admins can manage niches
CREATE POLICY "Admins can manage niches"
  ON niches FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================
-- TICKETS POLICIES
-- ============================================
-- Users can view their own tickets
CREATE POLICY "Users can view own tickets"
  ON tickets FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own tickets
CREATE POLICY "Users can insert own tickets"
  ON tickets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own tickets (limited fields)
CREATE POLICY "Users can update own tickets"
  ON tickets FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all tickets
CREATE POLICY "Admins can view all tickets"
  ON tickets FOR SELECT
  USING (is_admin());

-- Admins can update all tickets
CREATE POLICY "Admins can update all tickets"
  ON tickets FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================
-- TICKET_REPLIES POLICIES
-- ============================================
-- Users can view replies to their own tickets
CREATE POLICY "Users can view replies to own tickets"
  ON ticket_replies FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tickets
      WHERE tickets.id = ticket_replies.ticket_id
      AND tickets.user_id = auth.uid()
    )
  );

-- Users can insert replies to their own tickets
CREATE POLICY "Users can insert replies to own tickets"
  ON ticket_replies FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tickets
      WHERE tickets.id = ticket_replies.ticket_id
      AND tickets.user_id = auth.uid()
    )
    AND ticket_replies.from_role = 'user'
    AND ticket_replies.user_id = auth.uid()
  );

-- Admins can view all ticket replies
CREATE POLICY "Admins can view all ticket replies"
  ON ticket_replies FOR SELECT
  USING (is_admin());

-- Admins can insert replies to any ticket
CREATE POLICY "Admins can insert replies to any ticket"
  ON ticket_replies FOR INSERT
  WITH CHECK (
    is_admin()
    AND ticket_replies.from_role = 'admin'
    AND ticket_replies.user_id = auth.uid()
  );

-- ============================================
-- PAYMENTS POLICIES
-- ============================================
-- Users can view their own payments
CREATE POLICY "Users can view own payments"
  ON payments FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all payments
CREATE POLICY "Admins can view all payments"
  ON payments FOR SELECT
  USING (is_admin());

-- Only admins can insert payments (or system via service role)
CREATE POLICY "Admins can insert payments"
  ON payments FOR INSERT
  WITH CHECK (is_admin());

-- Only admins can update payments
CREATE POLICY "Admins can update payments"
  ON payments FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================
-- COMMUNITIES POLICIES
-- ============================================
-- Authenticated users can view active communities
CREATE POLICY "Authenticated users can view active communities"
  ON communities FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Admins can view all communities
CREATE POLICY "Admins can view all communities"
  ON communities FOR SELECT
  USING (is_admin());

-- Only admins can manage communities
CREATE POLICY "Admins can manage communities"
  ON communities FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================
-- COMMUNITY_MEMBERS POLICIES
-- ============================================
-- Users can view their own memberships
CREATE POLICY "Users can view own memberships"
  ON community_members FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own memberships (join community)
CREATE POLICY "Users can insert own memberships"
  ON community_members FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM communities
      WHERE communities.id = community_members.community_id
      AND communities.is_active = true
    )
  );

-- Users can delete their own memberships (leave community)
CREATE POLICY "Users can delete own memberships"
  ON community_members FOR DELETE
  USING (auth.uid() = user_id);

-- Admins can view all memberships
CREATE POLICY "Admins can view all memberships"
  ON community_members FOR SELECT
  USING (is_admin());

-- Admins can manage all memberships
CREATE POLICY "Admins can manage all memberships"
  ON community_members FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

