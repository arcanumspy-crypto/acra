-- ============================================
-- Facebook Ad Library scraper support
-- Adds additional columns to offers + scalability metrics table
-- ============================================

ALTER TABLE offers
  ADD COLUMN IF NOT EXISTS ad_text TEXT,
  ADD COLUMN IF NOT EXISTS page_name TEXT,
  ADD COLUMN IF NOT EXISTS landing_page_url TEXT,
  ADD COLUMN IF NOT EXISTS creative_asset_urls JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS ad_library_snapshot JSONB;

CREATE TABLE IF NOT EXISTS offer_scalability_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  offer_id UUID UNIQUE REFERENCES offers(id) ON DELETE CASCADE,
  creative_count INTEGER NOT NULL DEFAULT 0,
  impressions_range TEXT,
  frequency_score NUMERIC,
  is_high_scale BOOLEAN NOT NULL DEFAULT false,
  first_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  run_count INTEGER NOT NULL DEFAULT 1,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_offer_scalability_offer_id ON offer_scalability_metrics(offer_id);
CREATE INDEX IF NOT EXISTS idx_offer_scalability_is_high_scale ON offer_scalability_metrics(is_high_scale);


