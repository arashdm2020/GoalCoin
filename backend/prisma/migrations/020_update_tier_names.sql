-- ============================================
-- Update Fan Tier Names (Cosmetic Only)
-- Per James request: Nov 10, 2025
-- ============================================

-- Update tier enum (need to recreate)
ALTER TYPE fan_tier RENAME TO fan_tier_old;

CREATE TYPE fan_tier AS ENUM ('MINTED', 'STAKED', 'VERIFIED', 'ASCENDANT', 'APEX');

-- Update users table
ALTER TABLE users ALTER COLUMN fan_tier DROP DEFAULT;
ALTER TABLE users ALTER COLUMN fan_tier TYPE fan_tier USING 
  CASE fan_tier::text
    WHEN 'ROOKIE' THEN 'MINTED'::fan_tier
    WHEN 'SUPPORTER' THEN 'STAKED'::fan_tier
    WHEN 'PRO' THEN 'VERIFIED'::fan_tier
    WHEN 'ELITE' THEN 'ASCENDANT'::fan_tier
    WHEN 'LEGEND' THEN 'APEX'::fan_tier
    ELSE 'MINTED'::fan_tier
  END;
ALTER TABLE users ALTER COLUMN fan_tier SET DEFAULT 'MINTED';

DROP TYPE fan_tier_old;

-- Update fan_tier_config table with new names
UPDATE fan_tier_config SET tier = 'MINTED' WHERE tier = 'ROOKIE';
UPDATE fan_tier_config SET tier = 'STAKED' WHERE tier = 'SUPPORTER';
UPDATE fan_tier_config SET tier = 'VERIFIED' WHERE tier = 'PRO';
UPDATE fan_tier_config SET tier = 'ASCENDANT' WHERE tier = 'ELITE';
UPDATE fan_tier_config SET tier = 'APEX' WHERE tier = 'LEGEND';

-- Update descriptions to match new tier names
UPDATE fan_tier_config SET description = 'Newly minted - Just getting started' WHERE tier = 'MINTED';
UPDATE fan_tier_config SET description = 'Staked in - Committed to the journey' WHERE tier = 'STAKED';
UPDATE fan_tier_config SET description = 'Verified athlete - Proven consistency' WHERE tier = 'VERIFIED';
UPDATE fan_tier_config SET description = 'Ascendant - Rising to the top' WHERE tier = 'ASCENDANT';
UPDATE fan_tier_config SET description = 'Apex - Ultimate dedication achieved' WHERE tier = 'APEX';

-- Update tier progression history
UPDATE tier_progression_history SET old_tier = 'MINTED' WHERE old_tier = 'ROOKIE';
UPDATE tier_progression_history SET old_tier = 'STAKED' WHERE old_tier = 'SUPPORTER';
UPDATE tier_progression_history SET old_tier = 'VERIFIED' WHERE old_tier = 'PRO';
UPDATE tier_progression_history SET old_tier = 'ASCENDANT' WHERE old_tier = 'ELITE';
UPDATE tier_progression_history SET old_tier = 'APEX' WHERE old_tier = 'LEGEND';

UPDATE tier_progression_history SET new_tier = 'MINTED' WHERE new_tier = 'ROOKIE';
UPDATE tier_progression_history SET new_tier = 'STAKED' WHERE new_tier = 'SUPPORTER';
UPDATE tier_progression_history SET new_tier = 'VERIFIED' WHERE new_tier = 'PRO';
UPDATE tier_progression_history SET new_tier = 'ASCENDANT' WHERE new_tier = 'ELITE';
UPDATE tier_progression_history SET new_tier = 'APEX' WHERE new_tier = 'LEGEND';

-- Update function to use new tier names
CREATE OR REPLACE FUNCTION get_fan_tier_from_xp(p_xp INT) RETURNS VARCHAR(20) AS $$
DECLARE
  v_tier VARCHAR(20);
BEGIN
  SELECT tier INTO v_tier
  FROM fan_tier_config
  WHERE p_xp >= min_xp AND (max_xp IS NULL OR p_xp <= max_xp)
  ORDER BY min_xp DESC
  LIMIT 1;
  
  RETURN COALESCE(v_tier, 'MINTED');
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE fan_tier_config IS 'Fan tier thresholds and bonuses (MINTED → STAKED → VERIFIED → ASCENDANT → APEX)';
