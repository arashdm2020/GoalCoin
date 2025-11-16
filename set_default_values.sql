-- Set default values for all nullable fields to prevent NULL issues for new users

-- Set default for fan_tier
ALTER TABLE users ALTER COLUMN fan_tier SET DEFAULT 'ROOKIE';

-- Set default for streak_multiplier
ALTER TABLE users ALTER COLUMN streak_multiplier SET DEFAULT 1.0;

-- Set default for milestone_multiplier
ALTER TABLE users ALTER COLUMN milestone_multiplier SET DEFAULT 1.0;

-- Verify defaults are set
SELECT 
    column_name,
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('fan_tier', 'streak_multiplier', 'milestone_multiplier')
ORDER BY column_name;
