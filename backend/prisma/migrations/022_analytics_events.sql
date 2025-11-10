-- ============================================
-- Analytics Events Table
-- Track all user events for analytics
-- ============================================

CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name VARCHAR(255) NOT NULL,
  user_id VARCHAR(255),
  properties JSONB DEFAULT '{}',
  country_code VARCHAR(10),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_analytics_events_name ON analytics_events(event_name, created_at DESC);
CREATE INDEX idx_analytics_events_user ON analytics_events(user_id, created_at DESC);
CREATE INDEX idx_analytics_events_country ON analytics_events(country_code, created_at DESC);
CREATE INDEX idx_analytics_events_created ON analytics_events(created_at DESC);
CREATE INDEX idx_analytics_properties_gin ON analytics_events USING GIN (properties);

-- Auto-cleanup old events (keep 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_analytics_events() RETURNS void AS $$
BEGIN
  DELETE FROM analytics_events
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE analytics_events IS 'Analytics events for tracking user behavior and platform metrics';
