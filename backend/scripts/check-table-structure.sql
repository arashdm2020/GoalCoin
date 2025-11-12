-- Check structure of main tables
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'challenges', 'referrals', 'ad_views', 'reviewers', 'submissions', 'reviews', 'audit_logs')
ORDER BY table_name, ordinal_position;
