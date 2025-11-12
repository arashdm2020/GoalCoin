-- Seed data with correct table structure
-- Clean existing data in correct order
DELETE FROM audit_logs;
DELETE FROM reviews;
DELETE FROM submissions;
DELETE FROM reviewers;
DELETE FROM ad_views;
DELETE FROM referrals;
DELETE FROM challenges;
DELETE FROM users;

-- Create 500 users
INSERT INTO users (id, wallet, email) VALUES
('user_1', '0x7f9a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0', 'fitathlete1@example.com'),
('user_2', '0x8b9c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0', 'strongchampion5678@example.com'),
('user_3', '0x9c8d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1', 'activewarrior9012@example.com'),
('user_4', '0x0d9e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2', 'healthyhero3456@example.com'),
('user_5', '0x1eaf5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3', 'energystar7890@example.com'),
('user_6', '0x2fb06b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4', 'powermaster2345@example.com'),
('user_7', '0x3c117c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5', 'speedlegend6789@example.com'),
('user_8', '0x4d228d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6', 'agilepro0123@example.com'),
('user_9', '0x5e339e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7', 'dynamicexpert4567@example.com'),
('user_10', '0x6f44a0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8', 'eliteguru8901@example.com');

-- Add more users (continuing the pattern to reach 500)
INSERT INTO users (id, wallet, email) 
SELECT 
    'user_' || (g + 11),
    '0x' || encode(gen_random_bytes(20), 'hex'),
    'user' || (g + 11) || '@example.com'
FROM generate_series(1, 490) g;

-- Create 100 challenges
INSERT INTO challenges (id, title, start_date, end_date, active) VALUES
('challenge_1', '90-Day Challenge', NOW() - INTERVAL '60 days', NOW() + INTERVAL '30 days', true),
('challenge_2', 'Fitness Challenge', NOW() - INTERVAL '45 days', NOW() + INTERVAL '45 days', true),
('challenge_3', 'Strength Challenge', NOW() - INTERVAL '30 days', NOW() + INTERVAL '60 days', true);

-- Add more challenges
INSERT INTO challenges (id, title, start_date, end_date, active)
SELECT 
    'challenge_' || (g + 4),
    'Challenge ' || (g + 4),
    NOW() - (random() * 90 || ' days')::INTERVAL,
    NOW() + (random() * 365 || ' days')::INTERVAL,
    random() > 0.2
FROM generate_series(1, 97) g;

-- Create 200 referrals
INSERT INTO referrals (id, referrer_id, referred_id, status) VALUES
('referral_1', 'user_1', 'user_2', 'signed_up'),
('referral_2', 'user_3', 'user_4', 'signed_up'),
('referral_3', 'user_5', 'user_6', 'signed_up');

-- Add more referrals
INSERT INTO referrals (id, referrer_id, referred_id, status)
SELECT 
    'referral_' || (g + 4),
    'user_' || floor(random() * 500 + 1),
    'user_' || floor(random() * 500 + 1),
    'signed_up'
FROM generate_series(1, 197) g
WHERE floor(random() * 500 + 1) <> floor(random() * 500 + 1);

-- Create 3000 ad views
INSERT INTO ad_views (id, user_id, ad_type) VALUES
('ad_view_1', 'user_1', 'BANNER'),
('ad_view_2', 'user_2', 'VIDEO'),
('ad_view_3', 'user_3', 'POPUP');

-- Add more ad views
INSERT INTO ad_views (id, user_id, ad_type)
SELECT 
    'ad_view_' || (g + 4),
    'user_' || floor(random() * 500 + 1),
    (ARRAY['BANNER', 'VIDEO', 'POPUP'])[floor(random() * 3)]
FROM generate_series(1, 2997) g;

-- Create 50 reviewers (from first 50 users)
INSERT INTO reviewers (id, user_id, voting_weight, strikes, status)
SELECT 
    'user_' || g,
    'user_' || g,
    floor(random() * 3) + 1,
    floor(random() * 3),
    (ARRAY['ACTIVE', 'SUSPENDED'])[floor(random() * 2)]
FROM generate_series(1, 50) g;

-- Create 300 submissions
INSERT INTO submissions (id, user_id, challenge_id, week_no, file_url, status) VALUES
('submission_1', 'user_51', 'challenge_1', 1, 'https://example.com/files/sub1.mp4', 'PENDING'),
('submission_2', 'user_52', 'challenge_2', 2, 'https://example.com/files/sub2.mp4', 'APPROVED'),
('submission_3', 'user_53', 'challenge_3', 3, 'https://example.com/files/sub3.mp4', 'REJECTED');

-- Add more submissions
INSERT INTO submissions (id, user_id, challenge_id, week_no, file_url, status)
SELECT 
    'submission_' || (g + 4),
    'user_' || floor(random() * 500 + 1),
    'challenge_' || floor(random() * 100 + 1),
    floor(random() * 12) + 1,
    'https://example.com/files/' || encode(gen_random_bytes(8), 'hex') || '.mp4',
    (ARRAY['PENDING', 'APPROVED', 'REJECTED'])[floor(random() * 3)]
FROM generate_series(1, 297) g;

-- Create 600 reviews
INSERT INTO reviews (id, submission_id, reviewer_wallet, vote) VALUES
('review_1', 'submission_1', (SELECT wallet FROM users WHERE id = 'user_1'), 'APPROVE'),
('review_2', 'submission_2', (SELECT wallet FROM users WHERE id = 'user_2'), 'REJECT'),
('review_3', 'submission_3', (SELECT wallet FROM users WHERE id = 'user_3'), 'APPROVE');

-- Add more reviews
INSERT INTO reviews (id, submission_id, reviewer_wallet, vote)
SELECT 
    'review_' || (g + 4),
    'submission_' || floor(random() * 300 + 1),
    (SELECT wallet FROM users WHERE id = 'user_' || floor(random() * 50 + 1)),
    CASE WHEN random() > 0.2 THEN 'APPROVE' ELSE 'REJECT' END
FROM generate_series(1, 597) g;

-- Create 500 audit logs
INSERT INTO audit_logs (id, action, entity_type, entity_id, reviewer_id) VALUES
('audit_1', 'STATUS_CHANGE', 'reviewer', 'user_1', 'user_1'),
('audit_2', 'STRIKE_ADDED', 'reviewer', 'user_2', 'user_2'),
('audit_3', 'STRIKE_RESET', 'reviewer', 'user_3', 'user_3');

-- Add more audit logs
INSERT INTO audit_logs (id, action, entity_type, entity_id, reviewer_id)
SELECT 
    'audit_' || (g + 4),
    (ARRAY['STATUS_CHANGE', 'STRIKE_ADDED', 'STRIKE_RESET', 'REVIEWER_ADDED', 'REVIEWER_REMOVED'])[floor(random() * 5)],
    'reviewer',
    'user_' || floor(random() * 50 + 1),
    'user_' || floor(random() * 50 + 1)
FROM generate_series(1, 497) g;

-- Verify data was created
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
