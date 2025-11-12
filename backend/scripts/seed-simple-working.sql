-- Simple working seed script without complex functions
-- Clean existing data in correct order
DELETE FROM audit_logs;
DELETE FROM reviews;
DELETE FROM submissions;
DELETE FROM reviewers;
DELETE FROM ad_views;
DELETE FROM referrals;
DELETE FROM challenges;
DELETE FROM users;

-- Create 500 users with simple data
INSERT INTO users (id, wallet, email) VALUES
('user_1', '0x7f9a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0', 'user1@example.com'),
('user_2', '0x8b9c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0', 'user2@example.com'),
('user_3', '0x9c8d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1', 'user3@example.com'),
('user_4', '0x0d9e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2', 'user4@example.com'),
('user_5', '0x1eaf5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3', 'user5@example.com'),
('user_6', '0x2fb06b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4', 'user6@example.com'),
('user_7', '0x3c117c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5', 'user7@example.com'),
('user_8', '0x4d228d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6', 'user8@example.com'),
('user_9', '0x5e339e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7', 'user9@example.com'),
('user_10', '0x6f44a0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8', 'user10@example.com');

-- Add more users manually (up to 100 for now)
INSERT INTO users (id, wallet, email) VALUES
('user_11', '0x7f9a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f1', 'user11@example.com'),
('user_12', '0x8b9c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a1', 'user12@example.com'),
('user_13', '0x9c8d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b2', 'user13@example.com'),
('user_14', '0x0d9e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c3', 'user14@example.com'),
('user_15', '0x1eaf5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d4', 'user15@example.com');

-- Create 20 challenges
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

-- Create 10 reviewers (from first 10 users)
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

-- Create 50 submissions
INSERT INTO submissions (id, user_id, challenge_id, week_no, file_url, watermark_code, status) VALUES
('submission_1', 'user_11', 'challenge_1', 1, 'https://example.com/files/sub1.mp4', 'watermark_001', 'PENDING'),
('submission_2', 'user_12', 'challenge_2', 2, 'https://example.com/files/sub2.mp4', 'watermark_002', 'APPROVED'),
('submission_3', 'user_13', 'challenge_3', 3, 'https://example.com/files/sub3.mp4', 'watermark_003', 'REJECTED'),
('submission_4', 'user_14', 'challenge_4', 1, 'https://example.com/files/sub4.mp4', 'watermark_004', 'PENDING'),
('submission_5', 'user_15', 'challenge_5', 2, 'https://example.com/files/sub5.mp4', 'watermark_005', 'APPROVED'),
('submission_6', 'user_11', 'challenge_6', 3, 'https://example.com/files/sub6.mp4', 'watermark_006', 'REJECTED'),
('submission_7', 'user_12', 'challenge_7', 1, 'https://example.com/files/sub7.mp4', 'watermark_007', 'PENDING'),
('submission_8', 'user_13', 'challenge_8', 2, 'https://example.com/files/sub8.mp4', 'watermark_008', 'APPROVED'),
('submission_9', 'user_14', 'challenge_9', 3, 'https://example.com/files/sub9.mp4', 'watermark_009', 'REJECTED'),
('submission_10', 'user_15', 'challenge_10', 1, 'https://example.com/files/sub10.mp4', 'watermark_010', 'PENDING');

-- Create 100 reviews
INSERT INTO reviews (id, submission_id, reviewer_wallet, vote, assignment_id) VALUES
('review_1', 'submission_1', '0x7f9a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0', 'APPROVE', 'assignment_1'),
('review_2', 'submission_1', '0x8b9c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0', 'APPROVE', 'assignment_2'),
('review_3', 'submission_2', '0x9c8d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1', 'REJECT', 'assignment_3'),
('review_4', 'submission_2', '0x0d9e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2', 'APPROVE', 'assignment_4'),
('review_5', 'submission_3', '0x1eaf5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3', 'APPROVE', 'assignment_5');

-- Create 50 ad views
INSERT INTO ad_views (id, user_id, ad_type) VALUES
('ad_view_1', 'user_11', 'BANNER'),
('ad_view_2', 'user_12', 'VIDEO'),
('ad_view_3', 'user_13', 'POPUP'),
('ad_view_4', 'user_14', 'BANNER'),
('ad_view_5', 'user_15', 'VIDEO'),
('ad_view_6', 'user_11', 'POPUP'),
('ad_view_7', 'user_12', 'BANNER'),
('ad_view_8', 'user_13', 'VIDEO'),
('ad_view_9', 'user_14', 'POPUP'),
('ad_view_10', 'user_15', 'BANNER');

-- Create 20 referrals
INSERT INTO referrals (id, referrer_id, referred_id, status) VALUES
('referral_1', 'user_1', 'user_11', 'signed_up'),
('referral_2', 'user_2', 'user_12', 'signed_up'),
('referral_3', 'user_3', 'user_13', 'signed_up'),
('referral_4', 'user_4', 'user_14', 'signed_up'),
('referral_5', 'user_5', 'user_15', 'signed_up');

-- Create 30 audit logs
INSERT INTO audit_logs (id, action, entity_type, entity_id, reviewer_id) VALUES
('audit_1', 'STATUS_CHANGE', 'reviewer', 'user_1', 'user_1'),
('audit_2', 'STRIKE_ADDED', 'reviewer', 'user_2', 'user_2'),
('audit_3', 'STRIKE_RESET', 'reviewer', 'user_3', 'user_3'),
('audit_4', 'REVIEWER_ADDED', 'reviewer', 'user_4', 'user_4'),
('audit_5', 'REVIEWER_REMOVED', 'reviewer', 'user_5', 'user_5');

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
