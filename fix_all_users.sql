-- Fix all NULL/empty fields for all users

-- 1. Set fan_tier to ROOKIE for users without it
UPDATE users SET fan_tier = 'ROOKIE' WHERE fan_tier IS NULL;

-- 2. Set tier_updated_at to created_at if NULL
UPDATE users SET tier_updated_at = created_at WHERE tier_updated_at IS NULL;

-- 3. Set last_streak_update to last_activity_date or created_at if NULL
UPDATE users SET last_streak_update = COALESCE(last_activity_date, created_at) WHERE last_streak_update IS NULL;

-- 4. Set burn_multiplier to 1.0 if NULL
UPDATE users SET burn_multiplier = 1.0 WHERE burn_multiplier IS NULL;

-- 5. Set streak_multiplier to 1.0 if NULL
UPDATE users SET streak_multiplier = 1.0 WHERE streak_multiplier IS NULL;

-- 6. Set milestone_multiplier to 1.0 if NULL
UPDATE users SET milestone_multiplier = 1.0 WHERE milestone_multiplier IS NULL;

-- Verify counts
SELECT 
    COUNT(*) FILTER (WHERE fan_tier IS NULL) as null_fan_tier,
    COUNT(*) FILTER (WHERE tier_updated_at IS NULL) as null_tier_updated,
    COUNT(*) FILTER (WHERE last_streak_update IS NULL) as null_streak_update,
    COUNT(*) FILTER (WHERE burn_multiplier IS NULL) as null_burn_multiplier
FROM users;
