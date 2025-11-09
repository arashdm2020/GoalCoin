-- Add grace days and streak freeze features to users table

ALTER TABLE users 
  ADD COLUMN grace_days_remaining INT NOT NULL DEFAULT 2,
  ADD COLUMN grace_days_used_this_month INT NOT NULL DEFAULT 0,
  ADD COLUMN streak_freeze_tokens INT NOT NULL DEFAULT 0,
  ADD COLUMN streak_frozen_until TIMESTAMP NULL;

-- Add index for streak freeze queries
CREATE INDEX IF NOT EXISTS idx_users_streak_frozen ON users(streak_frozen_until) WHERE streak_frozen_until IS NOT NULL;

COMMENT ON COLUMN users.grace_days_remaining IS 'Number of grace days remaining this month (resets monthly)';
COMMENT ON COLUMN users.grace_days_used_this_month IS 'Number of grace days used in current month';
COMMENT ON COLUMN users.streak_freeze_tokens IS 'Number of streak freeze tokens available';
COMMENT ON COLUMN users.streak_frozen_until IS 'Date until which streak is frozen (travel/sickness protection)';
