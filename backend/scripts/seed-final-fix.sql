-- Final fix for remaining data issues
-- Fix reviewers status
UPDATE reviewers SET status = 'ACTIVE' WHERE status IS NULL;

-- Create some sample reviews with proper assignment_id
INSERT INTO reviews (id, submission_id, reviewer_wallet, vote, assignment_id) VALUES
('review_1', 'submission_1', (SELECT wallet FROM users WHERE id = 'user_1'), 'APPROVE'::"VoteType", NULL),
('review_2', 'submission_1', (SELECT wallet FROM users WHERE id = 'user_2'), 'APPROVE'::"VoteType", NULL),
('review_3', 'submission_2', (SELECT wallet FROM users WHERE id = 'user_3'), 'REJECT'::"VoteType", NULL),
('review_4', 'submission_2', (SELECT wallet FROM users WHERE id = 'user_4'), 'APPROVE'::"VoteType", NULL),
('review_5', 'submission_3', (SELECT wallet FROM users WHERE id = 'user_5'), 'APPROVE'::"VoteType", NULL);

-- Create more reviews
INSERT INTO reviews (id, submission_id, reviewer_wallet, vote, assignment_id)
SELECT 
    'review_' || g,
    'submission_' || floor(random() * 5 + 1),
    (SELECT wallet FROM users WHERE id = 'user_' || floor(random() * 10 + 1)),
    CASE WHEN random() > 0.2 THEN 'APPROVE'::"VoteType" ELSE 'REJECT'::"VoteType" END,
    NULL
FROM generate_series(6, 50) g;

-- Fix submissions status
UPDATE submissions SET status = 'PENDING'::"SubmissionStatus" WHERE status = 'PENDING';
UPDATE submissions SET status = 'APPROVED'::"SubmissionStatus" WHERE status = 'APPROVED';
UPDATE submissions SET status = 'REJECTED'::"SubmissionStatus" WHERE status = 'REJECTED';

-- Create more submissions
INSERT INTO submissions (id, user_id, challenge_id, week_no, file_url, watermark_code, status)
SELECT 
    'submission_' || g,
    'user_' || floor(random() * 500 + 1),
    'challenge_' || floor(random() * 100 + 1),
    floor(random() * 12) + 1,
    'https://example.com/files/sub' || g || '.mp4',
    'watermark_' || lpad(g::text, 3, '0'),
    'PENDING'::"SubmissionStatus"
FROM generate_series(6, 100) g;

-- Fix ad_views ad_type
UPDATE ad_views SET ad_type = 'BANNER' WHERE ad_type IS NULL;

-- Create more ad views
INSERT INTO ad_views (id, user_id, ad_type)
SELECT 
    'ad_view_' || g,
    'user_' || floor(random() * 500 + 1),
    (ARRAY['BANNER', 'VIDEO', 'POPUP'])[floor(random() * 3)]
FROM generate_series(6, 1000) g;

-- Fix audit_logs action
UPDATE audit_logs SET action = 'STATUS_CHANGE' WHERE action IS NULL;

-- Create more audit logs
INSERT INTO audit_logs (id, action, entity_type, entity_id, reviewer_id)
SELECT 
    'audit_' || g,
    (ARRAY['STATUS_CHANGE', 'STRIKE_ADDED', 'STRIKE_RESET', 'REVIEWER_ADDED', 'REVIEWER_REMOVED'])[floor(random() * 5)],
    'reviewer',
    'user_' || floor(random() * 10 + 1),
    'user_' || floor(random() * 10 + 1)
FROM generate_series(6, 100) g;

-- Verify final data
SELECT 'users' as table_name, COUNT(*) as record_count FROM users
UNION ALL
SELECT 'challenges', COUNT(*) FROM challenges
UNION ALL
SELECT 'referrals', COUNT(*) FROM referrals
UNION ALL
SELECT 'ad_views', COUNT(*) FROM ad_views
UNION ALL
SELECT 'reviewers', COUNT(*) FROM reviewers
UNION ALL
SELECT 'submissions', COUNT(*) FROM submissions
UNION ALL
SELECT 'reviews', COUNT(*) FROM reviews
UNION ALL
SELECT 'audit_logs', COUNT(*) FROM audit_logs
ORDER BY table_name;
