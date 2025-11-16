-- Fix all NULL fields that should have default values

-- Update tier_updated_at
UPDATE users SET tier_updated_at = created_at WHERE tier_updated_at IS NULL;

-- Update last_streak_update  
UPDATE users SET last_streak_update = COALESCE(last_activity_date, created_at) WHERE last_streak_update IS NULL;

-- Update fan_tier to NULL (it's nullable)
-- Already done

-- Check for any other NULL fields in NOT NULL columns
SELECT 
    column_name,
    COUNT(*) as null_count
FROM information_schema.columns c
LEFT JOIN (
    SELECT 
        attname as column_name,
        COUNT(*) FILTER (WHERE attnotnull AND pg_catalog.pg_get_expr(adbin, adrelid) IS NULL) as null_count
    FROM pg_attribute a
    LEFT JOIN pg_attrdef ad ON a.attrelid = ad.adrelid AND a.attnum = ad.adnum
    WHERE a.attrelid = 'users'::regclass 
    AND a.attnum > 0 
    AND NOT a.attisdropped
    GROUP BY attname
) nulls ON c.column_name = nulls.column_name
WHERE c.table_name = 'users' 
AND c.is_nullable = 'NO'
GROUP BY column_name;
