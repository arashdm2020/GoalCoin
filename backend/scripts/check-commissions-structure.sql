-- Check commissions table structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'commissions' 
ORDER BY ordinal_position;

-- Check if commissions table exists
SELECT COUNT(*) as record_count FROM commissions;
