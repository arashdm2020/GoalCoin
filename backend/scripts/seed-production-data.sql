-- Complete production data seeding script
-- Run this in your Render PostgreSQL dashboard

-- Clean existing data in correct order
DELETE FROM audit_logs;
DELETE FROM reviews;
DELETE FROM submissions;
DELETE FROM reviewers;
DELETE FROM ad_views;
DELETE FROM referrals;
DELETE FROM treasury_transactions;
DELETE FROM xp_transactions;
DELETE FROM user_challenges;
DELETE FROM challenges;
DELETE FROM users;

-- Create 500 users with random data
INSERT INTO users (id, wallet, email, handle, country_code, xp_points, goal_points, current_streak, burn_multiplier, created_at, updated_at) VALUES
('user_1', '0x7f9a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0', 'fitathlete1@example.com', 'FitAthlete1234', 'US', 8500, 4200, 15, 1.8, NOW() - INTERVAL '180 days', NOW()),
('user_2', '0x8b9c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0', 'strongchampion5678@example.com', 'StrongChampion5678', 'CN', 7200, 3800, 22, 2.1, NOW() - INTERVAL '150 days', NOW()),
('user_3', '0x9c8d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1', 'activewarrior9012@example.com', 'ActiveWarrior9012', 'JP', 9100, 4600, 8, 1.5, NOW() - INTERVAL '200 days', NOW()),
('user_4', '0x0d9e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2', 'healthyhero3456@example.com', 'HealthyHero3456', 'DE', 6800, 3400, 18, 1.9, NOW() - INTERVAL '120 days', NOW()),
('user_5', '0x1eaf5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3', 'energystar7890@example.com', 'EnergyStar7890', 'IN', 7900, 4100, 12, 2.3, NOW() - INTERVAL '90 days', NOW()),
('user_6', '0x2fb06b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4', 'powermaster2345@example.com', 'PowerMaster2345', 'GB', 8300, 4300, 25, 1.7, NOW() - INTERVAL '210 days', NOW()),
('user_7', '0x3c117c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5', 'speedlegend6789@example.com', 'SpeedLegend6789', 'FR', 7600, 3900, 6, 2.0, NOW() - INTERVAL '140 days', NOW()),
('user_8', '0x4d228d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6', 'agilepro0123@example.com', 'AgilePro0123', 'IT', 8800, 4500, 30, 1.6, NOW() - INTERVAL '170 days', NOW()),
('user_9', '0x5e339e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7', 'dynamicexpert4567@example.com', 'DynamicExpert4567', 'BR', 6500, 3200, 14, 2.2, NOW() - INTERVAL '100 days', NOW()),
('user_10', '0x6f44a0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8', 'eliteguru8901@example.com', 'EliteGuru8901', 'CA', 9200, 4700, 20, 1.8, NOW() - INTERVAL '160 days', NOW());

-- Add more users (continuing the pattern to reach 500)
INSERT INTO users (id, wallet, email, handle, country_code, xp_points, goal_points, current_streak, burn_multiplier, created_at, updated_at) 
SELECT 
    'user_' || (g + 11),
    '0x' || encode(gen_random_bytes(20), 'hex'),
    'user' || (g + 11) || '@example.com',
    'User' || (g + 11),
    (ARRAY['US', 'CN', 'JP', 'DE', 'IN', 'GB', 'FR', 'IT', 'BR', 'CA', 'KR', 'RU', 'AU', 'ES', 'MX', 'ID', 'NL', 'SA', 'TR', 'CH', 'TW', 'BE', 'IE', 'IL', 'NO', 'AE', 'EG', 'NG', 'ZA', 'AR', 'TH', 'SG', 'MY', 'PH', 'CL', 'PK', 'BD', 'VN', 'CO', 'PL', 'SE', 'AT', 'DK', 'FI', 'CZ', 'PT', 'GR', 'NZ', 'HU', 'RO'])[floor(random() * 50)],
    floor(random() * 10000),
    floor(random() * 5000),
    floor(random() * 30),
    1 + random() * 2,
    NOW() - (random() * 365 || ' days')::INTERVAL,
    NOW()
FROM generate_series(1, 490) g;

-- Create 100 challenges
INSERT INTO challenges (id, title, description, type, xp_reward, goal_reward, start_date, end_date, is_active, created_at, updated_at)
SELECT 
    'challenge_' || g,
    'Challenge ' || g,
    'Description for challenge ' || g,
    (ARRAY['WORKOUT', 'MEAL', 'WARMUP_ROUTINE'])[floor(random() * 3)],
    floor(random() * 100) + 10,
    floor(random() * 50) + 5,
    NOW() - (random() * 90 || ' days')::INTERVAL,
    NOW() + (random() * 365 || ' days')::INTERVAL,
    random() > 0.2,
    NOW() - (random() * 180 || ' days')::INTERVAL,
    NOW()
FROM generate_series(1, 100) g;

-- Create 1000 user challenges
INSERT INTO user_challenges (user_id, challenge_id, status, completed_at, created_at, updated_at)
SELECT 
    'user_' || floor(random() * 500 + 1),
    'challenge_' || floor(random() * 100 + 1),
    CASE WHEN random() > 0.3 THEN 'COMPLETED' ELSE 'IN_PROGRESS' END,
    CASE WHEN random() > 0.3 THEN NOW() - (random() * 30 || ' days')::INTERVAL ELSE NULL END,
    NOW() - (random() * 60 || ' days')::INTERVAL,
    NOW()
FROM generate_series(1, 1000) g;

-- Create 2000 XP transactions
INSERT INTO xp_transactions (user_id, xp_points, goal_points, transaction_type, created_at)
SELECT 
    'user_' || floor(random() * 500 + 1),
    floor(random() * 200) + 10,
    floor(random() * 100) + 5,
    'CHALLENGE_COMPLETED',
    NOW() - (random() * 180 || ' days')::INTERVAL
FROM generate_series(1, 2000) g;

-- Create 500 treasury transactions
INSERT INTO treasury_transactions (amount_usdt, amount_goalcoin, transaction_type, created_at)
SELECT 
    random() * 1000 + 50,
    random() * 10000 + 500,
    CASE WHEN random() > 0.5 THEN 'DEPOSIT' ELSE 'BURN' END,
    NOW() - (random() * 180 || ' days')::INTERVAL
FROM generate_series(1, 500) g;

-- Create 200 referrals
INSERT INTO referrals (referrer_id, referred_id, status, reward_points, created_at)
SELECT 
    'user_' || floor(random() * 500 + 1),
    'user_' || floor(random() * 500 + 1),
    'COMPLETED',
    floor(random() * 100) + 50,
    NOW() - (random() * 90 || ' days')::INTERVAL
FROM generate_series(1, 200) g
WHERE floor(random() * 500 + 1) <> floor(random() * 500 + 1);

-- Create 3000 ad views
INSERT INTO ad_views (user_id, ad_type, reward_points, created_at)
SELECT 
    'user_' || floor(random() * 500 + 1),
    (ARRAY['BANNER', 'VIDEO', 'POPUP'])[floor(random() * 3)],
    floor(random() * 10) + 1,
    NOW() - (random() * 30 || ' days')::INTERVAL
FROM generate_series(1, 3000) g;

-- Create 50 reviewers (from first 50 users)
INSERT INTO reviewers (id, user_id, voting_weight, strikes, status, created_at, updated_at)
SELECT 
    'user_' || g,
    'user_' || g,
    floor(random() * 3) + 1,
    floor(random() * 3),
    (ARRAY['ACTIVE', 'SUSPENDED'])[floor(random() * 2)],
    NOW() - (random() * 180 || ' days')::INTERVAL,
    NOW()
FROM generate_series(1, 50) g;

-- Create 300 submissions
INSERT INTO submissions (id, user_id, type, status, file_url, thumbnail, description, country_code, created_at, updated_at)
SELECT 
    'submission_' || g,
    'user_' || floor(random() * 500 + 1),
    (ARRAY['WORKOUT', 'MEAL', 'WARMUP_ROUTINE'])[floor(random() * 3)],
    (ARRAY['PENDING', 'APPROVED', 'REJECTED'])[floor(random() * 3)],
    'https://example.com/files/' || encode(gen_random_bytes(8), 'hex') || '.mp4',
    'https://example.com/thumbnails/' || encode(gen_random_bytes(8), 'hex') || '.jpg',
    'Description for submission ' || g,
    (ARRAY['US', 'CN', 'JP', 'DE', 'IN', 'GB', 'FR', 'IT', 'BR', 'CA', 'KR', 'RU', 'AU', 'ES', 'MX', 'ID', 'NL', 'SA', 'TR', 'CH', 'TW', 'BE', 'IE', 'IL', 'NO', 'AE', 'EG', 'NG', 'ZA', 'AR', 'TH', 'SG', 'MY', 'PH', 'CL', 'PK', 'BD', 'VN', 'CO', 'PL', 'SE', 'AT', 'DK', 'FI', 'CZ', 'PT', 'GR', 'NZ', 'HU', 'RO'])[floor(random() * 50)],
    NOW() - (random() * 60 || ' days')::INTERVAL,
    NOW()
FROM generate_series(1, 300) g;

-- Create 600 reviews
INSERT INTO reviews (id, submission_id, reviewer_wallet, vote, comment, created_at)
SELECT 
    'review_' || g,
    'submission_' || floor(random() * 300 + 1),
    (SELECT wallet FROM users WHERE id = 'user_' || floor(random() * 50 + 1)),
    CASE WHEN random() > 0.2 THEN 'APPROVE' ELSE 'REJECT' END,
    'Review comment ' || g,
    NOW() - (random() * 30 || ' days')::INTERVAL
FROM generate_series(1, 600) g;

-- Create 500 audit logs
INSERT INTO audit_logs (id, reviewer_id, action, details, created_at)
SELECT 
    'audit_' || g,
    'user_' || floor(random() * 50 + 1),
    (ARRAY['STATUS_CHANGE', 'STRIKE_ADDED', 'STRIKE_RESET', 'REVIEWER_ADDED', 'REVIEWER_REMOVED'])[floor(random() * 5)],
    'Audit log details ' || g,
    NOW() - (random() * 90 || ' days')::INTERVAL
FROM generate_series(1, 500) g;

-- Verify data was created
SELECT 'users' as table_name, COUNT(*) as record_count FROM users
UNION ALL
SELECT 'challenges', COUNT(*) FROM challenges
UNION ALL
SELECT 'user_challenges', COUNT(*) FROM user_challenges
UNION ALL
SELECT 'xp_transactions', COUNT(*) FROM xp_transactions
UNION ALL
SELECT 'treasury_transactions', COUNT(*) FROM treasury_transactions
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
