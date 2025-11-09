-- ============================================
-- GoalCoin Phase 2: Fan Tier System
-- ============================================

-- 1. Add fan tier enum and column
CREATE TYPE fan_tier AS ENUM ('ROOKIE', 'SUPPORTER', 'PRO', 'ELITE', 'LEGEND');

ALTER TABLE users ADD COLUMN IF NOT EXISTS fan_tier fan_tier DEFAULT 'ROOKIE';
ALTER TABLE users ADD COLUMN IF NOT EXISTS tier_updated_at TIMESTAMP;

-- 2. Fan tier configuration table
CREATE TABLE fan_tier_config (
  tier VARCHAR(20) PRIMARY KEY,
  min_xp INT NOT NULL,
  max_xp INT,
  badge_url VARCHAR(255),
  burn_multiplier_bonus FLOAT DEFAULT 0.0,
  description TEXT,
  color VARCHAR(20),
  icon VARCHAR(50)
);

-- 3. Seed tier configuration
INSERT INTO fan_tier_config (tier, min_xp, max_xp, badge_url, burn_multiplier_bonus, description, color, icon) VALUES
('ROOKIE', 0, 999, '/badges/rookie.svg', 0.01, 'Just getting started on your fitness journey', 'gray', '🌱'),
('SUPPORTER', 1000, 4999, '/badges/supporter.svg', 0.02, 'Committed to the journey', 'green', '💪'),
('PRO', 5000, 14999, '/badges/pro.svg', 0.03, 'Serious athlete with consistent progress', 'blue', '🏆'),
('ELITE', 15000, 49999, '/badges/elite.svg', 0.04, 'Top performer in the community', 'purple', '⭐'),
('LEGEND', 50000, NULL, '/badges/legend.svg', 0.05, 'Hall of fame - Ultimate dedication', 'gold', '👑');

-- 4. Create function to determine tier from XP
CREATE OR REPLACE FUNCTION get_fan_tier_from_xp(p_xp INT) RETURNS VARCHAR(20) AS $$
DECLARE
  v_tier VARCHAR(20);
BEGIN
  SELECT tier INTO v_tier
  FROM fan_tier_config
  WHERE p_xp >= min_xp AND (max_xp IS NULL OR p_xp <= max_xp)
  ORDER BY min_xp DESC
  LIMIT 1;
  
  RETURN COALESCE(v_tier, 'ROOKIE');
END;
$$ LANGUAGE plpgsql;

-- 5. Create trigger to auto-update fan tier when XP changes
CREATE OR REPLACE FUNCTION update_fan_tier_trigger() RETURNS TRIGGER AS $$
DECLARE
  v_new_tier VARCHAR(20);
  v_burn_bonus FLOAT;
BEGIN
  -- Calculate new tier
  v_new_tier := get_fan_tier_from_xp(NEW.xp_points);
  
  -- Get burn multiplier bonus
  SELECT burn_multiplier_bonus INTO v_burn_bonus
  FROM fan_tier_config
  WHERE tier = v_new_tier;
  
  -- Update if tier changed
  IF v_new_tier::fan_tier IS DISTINCT FROM OLD.fan_tier THEN
    NEW.fan_tier := v_new_tier::fan_tier;
    NEW.tier_updated_at := NOW();
    NEW.burn_multiplier := 1.0 + v_burn_bonus;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_fan_tier
BEFORE UPDATE ON users
FOR EACH ROW
WHEN (OLD.xp_points IS DISTINCT FROM NEW.xp_points)
EXECUTE FUNCTION update_fan_tier_trigger();

-- 6. Create tier progression history table
CREATE TABLE tier_progression_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  old_tier VARCHAR(20),
  new_tier VARCHAR(20) NOT NULL,
  xp_at_promotion INT NOT NULL,
  promoted_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_tier_history_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_tier_history_user ON tier_progression_history(user_id, promoted_at DESC);

-- 7. Update existing users to correct tier
UPDATE users 
SET fan_tier = get_fan_tier_from_xp(xp_points)::fan_tier,
    tier_updated_at = NOW();

COMMENT ON TABLE fan_tier_config IS 'Fan tier thresholds and bonuses (ROOKIE to LEGEND)';
COMMENT ON FUNCTION get_fan_tier_from_xp IS 'Automatically determine fan tier based on XP points';
COMMENT ON TRIGGER trg_update_fan_tier ON users IS 'Auto-update fan tier when XP changes';
