-- ============================================
-- GoalCoin Phase 2: XP Engine Migration
-- ============================================

-- 1. Create action_types table for configurable XP actions
CREATE TABLE action_types (
  action_key VARCHAR(50) PRIMARY KEY,
  xp_value INT NOT NULL,
  cooldown_sec INT DEFAULT 0,
  multiplier_cap FLOAT DEFAULT 1.5,
  daily_cap INT DEFAULT 0,
  enabled BOOLEAN DEFAULT true,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Add multiplier columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS streak_multiplier FLOAT DEFAULT 1.0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS milestone_multiplier FLOAT DEFAULT 1.0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_streak_update TIMESTAMP;

-- 3. Create XP events log for tracking all XP awards
CREATE TABLE xp_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  action_key VARCHAR(50) NOT NULL,
  xp_base INT NOT NULL,
  xp_multiplier FLOAT DEFAULT 1.0,
  xp_final INT NOT NULL,
  streak_days INT DEFAULT 0,
  idempotency_key VARCHAR(255) UNIQUE,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_xp_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_xp_action FOREIGN KEY (action_key) REFERENCES action_types(action_key)
);

-- 4. Create indexes for performance
CREATE INDEX idx_xp_events_user ON xp_events(user_id, created_at DESC);
CREATE INDEX idx_xp_events_action ON xp_events(action_key, created_at DESC);
CREATE INDEX idx_xp_events_idempotency ON xp_events(idempotency_key) WHERE idempotency_key IS NOT NULL;

-- 5. Seed initial action types
INSERT INTO action_types (action_key, xp_value, cooldown_sec, daily_cap, description) VALUES
-- Fitness Actions
('warmup_session', 10, 3600, 3, 'Complete a warmup session'),
('workout_cardio', 20, 3600, 2, 'Complete cardio workout'),
('workout_strength', 25, 3600, 2, 'Complete strength workout'),
('workout_flexibility', 15, 3600, 2, 'Complete flexibility workout'),
('meal_log', 15, 14400, 3, 'Log a healthy meal'),

-- Social Actions
('referral_signup', 50, 0, 0, 'Successful referral signup'),
('referral_activation', 50, 0, 0, 'Referral completes first workout'),

-- Content Actions
('content_watch', 5, 300, 10, 'Watch video content'),
('content_share', 10, 600, 5, 'Share content'),
('content_like', 2, 60, 20, 'Like content'),
('content_comment', 2, 60, 20, 'Comment on content'),

-- Challenge Actions
('submission_approved', 100, 0, 1, 'Weekly submission approved'),
('submission_streak_7', 50, 0, 0, '7-day submission streak bonus'),
('submission_streak_30', 200, 0, 0, '30-day submission streak bonus'),

-- Engagement Actions
('daily_login', 5, 86400, 1, 'Daily login bonus'),
('profile_complete', 25, 0, 1, 'Complete user profile'),
('first_workout', 50, 0, 1, 'First workout completed');

-- 6. Create action type audit log
CREATE TABLE action_type_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_key VARCHAR(50) NOT NULL,
  changed_by VARCHAR(255),
  old_value JSONB,
  new_value JSONB,
  change_type VARCHAR(20), -- 'create', 'update', 'delete'
  created_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE action_types IS 'Configurable XP action types with cooldowns and caps';
COMMENT ON TABLE xp_events IS 'Log of all XP awards with multipliers applied';
COMMENT ON COLUMN users.streak_multiplier IS 'Current streak multiplier (+2% every 7 days, max +10%)';
COMMENT ON COLUMN users.milestone_multiplier IS 'Milestone bonus (90-day=1.5x, 45-day=1.25x)';
