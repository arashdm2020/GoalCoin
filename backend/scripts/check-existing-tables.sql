-- Check which tables exist and their record counts
SELECT 
    table_name,
    CASE 
        WHEN table_name IN ('users', 'challenges', 'referrals', 'ad_views', 'reviewers', 'submissions', 'reviews', 'audit_logs') 
        THEN (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name)
        ELSE 0
    END as column_count
FROM information_schema.tables t 
WHERE t.table_schema = 'public' 
AND t.table_type = 'BASE TABLE'
ORDER BY table_name;
