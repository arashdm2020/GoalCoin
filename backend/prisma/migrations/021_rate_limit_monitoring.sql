-- ============================================
-- Rate Limit Monitoring Tables
-- ============================================

-- Rate limit violations log
CREATE TABLE IF NOT EXISTS rate_limit_violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip VARCHAR(45) NOT NULL,
  user_id VARCHAR(255),
  endpoint VARCHAR(255) NOT NULL,
  request_count INT NOT NULL,
  limit INT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_rate_violations_ip ON rate_limit_violations(ip, created_at DESC);
CREATE INDEX idx_rate_violations_endpoint ON rate_limit_violations(endpoint, created_at DESC);
CREATE INDEX idx_rate_violations_created ON rate_limit_violations(created_at DESC);

-- Blocked IPs table
CREATE TABLE IF NOT EXISTS blocked_ips (
  ip VARCHAR(45) PRIMARY KEY,
  reason TEXT NOT NULL,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_blocked_ips_expires ON blocked_ips(expires_at);

-- Auto-cleanup old violations (keep 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_rate_violations() RETURNS void AS $$
BEGIN
  DELETE FROM rate_limit_violations
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE rate_limit_violations IS 'Log of rate limit violations for monitoring';
COMMENT ON TABLE blocked_ips IS 'Blocked IP addresses with optional expiration';
