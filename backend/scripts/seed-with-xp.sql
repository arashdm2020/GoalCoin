-- Seed data with XP and Goal Points included
-- Clean existing data in correct order
DELETE FROM audit_logs;
DELETE FROM reviews;
DELETE FROM submissions;
DELETE FROM reviewers;
DELETE FROM ad_views;
DELETE FROM referrals;
DELETE FROM challenges;
DELETE FROM users;

-- Create 500 users with XP and Goal Points
INSERT INTO users (id, wallet, email, xp_points, goal_points) VALUES
('user_1', '0x7f9a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0', 'user1@example.com', 8500, 4200),
('user_2', '0x8b9c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0', 'user2@example.com', 7200, 3800),
('user_3', '0x9c8d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1', 'user3@example.com', 9100, 4600),
('user_4', '0x0d9e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2', 'user4@example.com', 6800, 3400),
('user_5', '0x1eaf5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3', 'user5@example.com', 7900, 4100),
('user_6', '0x2fb06b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4', 'user6@example.com', 8300, 4300),
('user_7', '0x3c117c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5', 'user7@example.com', 7600, 3900),
('user_8', '0x4d228d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6', 'user8@example.com', 8800, 4500),
('user_9', '0x5e339e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7', 'user9@example.com', 6500, 3200),
('user_10', '0x6f44a0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8', 'user10@example.com', 9200, 4700);

-- Add more users with XP and Goal Points (up to 100 for now)
INSERT INTO users (id, wallet, email, xp_points, goal_points) VALUES
('user_11', '0x7f9a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f1', 'user11@example.com', 5500, 2700),
('user_12', '0x8b9c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a1', 'user12@example.com', 6700, 3300),
('user_13', '0x9c8d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b2', 'user13@example.com', 7800, 3900),
('user_14', '0x0d9e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c3', 'user14@example.com', 8900, 4400),
('user_15', '0x1eaf5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d4', 'user15@example.com', 4900, 2400),
('user_16', '0x2fb06b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e5', 'user16@example.com', 6200, 3100),
('user_17', '0x3c117c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f6', 'user17@example.com', 7300, 3600),
('user_18', '0x4d228d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a7', 'user18@example.com', 8400, 4200),
('user_19', '0x5e339e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b8', 'user19@example.com', 9500, 4700),
('user_20', '0x6f44a0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c9', 'user20@example.com', 5900, 2900);

-- Add the remaining 480 users with random XP and Goal Points
INSERT INTO users (id, wallet, email, xp_points, goal_points) 
SELECT 
    'user_' || (g + 21),
    '0x' || substr(md5(g::text), 1, 40),
    'user' || (g + 21) || '@example.com',
    floor(random() * 10000) + 1000,
    floor(random() * 5000) + 500
FROM generate_series(1, 480) g;

-- Create 100 challenges
INSERT INTO challenges (id, title, start_date, end_date, active) VALUES
('challenge_1', '90-Day Challenge', NOW() - INTERVAL '60 days', NOW() + INTERVAL '30 days', true),
('challenge_2', 'Fitness Challenge', NOW() - INTERVAL '45 days', NOW() + INTERVAL '45 days', true),
('challenge_3', 'Strength Challenge', NOW() - INTERVAL '30 days', NOW() + INTERVAL '60 days', true),
('challenge_4', 'Cardio Challenge', NOW() - INTERVAL '20 days', NOW() + INTERVAL '70 days', true),
('challenge_5', 'Flexibility Challenge', NOW() - INTERVAL '10 days', NOW() + INTERVAL '80 days', true),
('challenge_6', 'Endurance Challenge', NOW() - INTERVAL '15 days', NOW() + INTERVAL '75 days', true),
('challenge_7', 'Power Challenge', NOW() - INTERVAL '25 days', NOW() + INTERVAL '65 days', true),
('challenge_8', 'Speed Challenge', NOW() - INTERVAL '35 days', NOW() + INTERVAL '55 days', true),
('challenge_9', 'Agility Challenge', NOW() - INTERVAL '40 days', NOW() + INTERVAL '50 days', true),
('challenge_10', 'Balance Challenge', NOW() - INTERVAL '50 days', NOW() + INTERVAL '40 days', true);

-- Add more challenges
INSERT INTO challenges (id, title, start_date, end_date, active)
SELECT 
    'challenge_' || (g + 11),
    'Challenge ' || (g + 11),
    NOW() - (random() * 90 || ' days')::INTERVAL,
    NOW() + (random() * 365 || ' days')::INTERVAL,
    random() > 0.2
FROM generate_series(1, 90) g;

-- Create 50 reviewers (from first 50 users)
INSERT INTO reviewers (id, user_id, voting_weight, strikes, status, updated_at) VALUES
('user_1', 'user_1', 1, 0, 'ACTIVE', NOW()),
('user_2', 'user_2', 2, 1, 'ACTIVE', NOW()),
('user_3', 'user_3', 1, 0, 'SUSPENDED', NOW()),
('user_4', 'user_4', 3, 2, 'ACTIVE', NOW()),
('user_5', 'user_5', 1, 0, 'ACTIVE', NOW()),
('user_6', 'user_6', 2, 1, 'SUSPENDED', NOW()),
('user_7', 'user_7', 1, 0, 'ACTIVE', NOW()),
('user_8', 'user_8', 1, 0, 'ACTIVE', NOW()),
('user_9', 'user_9', 2, 0, 'ACTIVE', NOW()),
('user_10', 'user_10', 1, 1, 'SUSPENDED', NOW());

-- Add more reviewers
INSERT INTO reviewers (id, user_id, voting_weight, strikes, status, updated_at)
SELECT 
    'user_' || (g + 11),
    'user_' || (g + 11),
    floor(random() * 3) + 1,
    floor(random() * 3),
    (ARRAY['ACTIVE', 'SUSPENDED'])[floor(random() * 2)],
    NOW()
FROM generate_series(1, 40) g;

-- Create 300 submissions
INSERT INTO submissions (id, user_id, challenge_id, week_no, file_url, watermark_code, status) VALUES
('submission_1', 'user_51', 'challenge_1', 1, 'https://example.com/files/sub1.mp4', 'watermark_001', 'PENDING'),
('submission_2', 'user_52', 'challenge_2', 2, 'https://example.com/files/sub2.mp4', 'watermark_002', 'APPROVED'),
('submission_3', 'user_53', 'challenge_3', 3, 'https://example.com/files/sub3.mp4', 'watermark_003', 'REJECTED'),
('submission_4', 'user_54', 'challenge_4', 1, 'https://example.com/files/sub4.mp4', 'watermark_004', 'PENDING'),
('submission_5', 'user_55', 'challenge_5', 2, 'https://example.com/files/sub5.mp4', 'watermark_005', 'APPROVED');

-- Add more submissions
INSERT INTO submissions (id, user_id, challenge_id, week_no, file_url, watermark_code, status)
SELECT 
    'submission_' || (g + 6),
    'user_' || floor(random() * 500 + 1),
    'challenge_' || floor(random() * 100 + 1),
    floor(random() * 12) + 1,
    'https://example.com/files/sub' || (g + 6) || '.mp4',
    'watermark_' || lpad((g + 6)::text, 3, '0'),
    (ARRAY['PENDING', 'APPROVED', 'REJECTED'])[floor(random() * 3)]
FROM generate_series(1, 295) g;

-- Create 600 reviews
INSERT INTO reviews (id, submission_id, reviewer_wallet, vote, assignment_id) VALUES
('review_1', 'submission_1', (SELECT wallet FROM users WHERE id = 'user_1'), 'APPROVE', 'assign_1'),
('review_2', 'submission_1', (SELECT wallet FROM users WHERE id = 'user_2'), 'APPROVE', 'assign_2'),
('review_3', 'submission_2', (SELECT wallet FROM users WHERE id = 'user_3'), 'REJECT', 'assign_3'),
('review_4', 'submission_2', (SELECT wallet FROM users WHERE id = 'user_4'), 'APPROVE', 'assign_4'),
('review_5', 'submission_3', (SELECT wallet FROM users WHERE id = 'user_5'), 'APPROVE', 'assign_5');

-- Add more reviews
INSERT INTO reviews (id, submission_id, reviewer_wallet, vote, assignment_id)
SELECT 
    'review_' || (g + 6),
    'submission_' || floor(random() * 300 + 1),
    (SELECT wallet FROM users WHERE id = 'user_' || floor(random() * 50 + 1)),
    CASE WHEN random() > 0.2 THEN 'APPROVE' ELSE 'REJECT' END,
    'assign_' || (g + 6)
FROM generate_series(1, 595) g;

-- Create 50 ad views
INSERT INTO ad_views (id, user_id, ad_type) VALUES
('ad_view_1', 'user_51', 'BANNER'),
('ad_view_2', 'user_52', 'VIDEO'),
('ad_view_3', 'user_53', 'POPUP'),
('ad_view_4', 'user_54', 'BANNER'),
('ad_view_5', 'user_55', 'VIDEO');

-- Add more ad views
INSERT INTO ad_views (id, user_id, ad_type)
SELECT 
    'ad_view_' || (g + 6),
    'user_' || floor(random() * 500 + 1),
    (ARRAY['BANNER', 'VIDEO', 'POPUP'])[floor(random() * 3)]
FROM generate_series(1, 2995) g;

-- Create 20 referrals
INSERT INTO referrals (id, referrer_id, referred_id, status) VALUES
('referral_1', 'user_1', 'user_51', 'signed_up'),
('referral_2', 'user_2', 'user_52', 'signed_up'),
('referral_3', 'user_3', 'user_53', 'signed_up'),
('referral_4', 'user_4', 'user_54', 'signed_up'),
('referral_5', 'user_5', 'user_55', 'signed_up');

-- Add more referrals
INSERT INTO referrals (id, referrer_id, referred_id, status)
SELECT 
    'referral_' || (g + 6),
    'user_' || floor(random() * 500 + 1),
    'user_' || floor(random() * 500 + 1),
    'signed_up'
FROM generate_series(1, 195) g
WHERE floor(random() * 500 + 1) <> floor(random() * 500 + 1);

-- Create 30 audit logs
INSERT INTO audit_logs (id, action, entity_type, entity_id, reviewer_id) VALUES
('audit_1', 'STATUS_CHANGE', 'reviewer', 'user_1', 'user_1'),
('audit_2', 'STRIKE_ADDED', 'reviewer', 'user_2', 'user_2'),
('audit_3', 'STRIKE_RESET', 'reviewer', 'user_3', 'user_3'),
('audit_4', 'REVIEWER_ADDED', 'reviewer', 'user_4', 'user_4'),
('audit_5', 'REVIEWER_REMOVED', 'reviewer', 'user_5', 'user_5');

-- Add more audit logs
INSERT INTO audit_logs (id, action, entity_type, entity_id, reviewer_id)
SELECT 
    'audit_' || (g + 6),
    (ARRAY['STATUS_CHANGE', 'STRIKE_ADDED', 'STRIKE_RESET', 'REVIEWER_ADDED', 'REVIEWER_REMOVED'])[floor(random() * 5)],
    'reviewer',
    'user_' || floor(random() * 50 + 1),
    'user_' || floor(random() * 50 + 1)
FROM generate_series(1, 495) g;

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
