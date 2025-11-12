-- Final seed script - fix reviews table
-- Create review assignments first
INSERT INTO reviews (id, submission_id, reviewer_wallet, vote, assignment_id) VALUES
('review_1', 'submission_1', '0x7f9a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0', 'APPROVE', NULL),
('review_2', 'submission_1', '0x8b9c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0', 'APPROVE', NULL),
('review_3', 'submission_2', '0x9c8d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1', 'REJECT', NULL),
('review_4', 'submission_2', '0x0d9e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2', 'APPROVE', NULL),
('review_5', 'submission_3', '0x1eaf5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3', 'APPROVE', NULL),
('review_6', 'submission_3', '0x2fb06b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4', 'REJECT', NULL),
('review_7', 'submission_4', '0x3c117c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5', 'APPROVE', NULL),
('review_8', 'submission_4', '0x4d228d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6', 'APPROVE', NULL),
('review_9', 'submission_5', '0x5e339e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7', 'REJECT', NULL),
('review_10', 'submission_5', '0x6f44a0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8', 'APPROVE', NULL);

-- Add more reviews
INSERT INTO reviews (id, submission_id, reviewer_wallet, vote, assignment_id) VALUES
('review_11', 'submission_6', '0x7f9a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0', 'APPROVE', NULL),
('review_12', 'submission_6', '0x8b9c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0', 'REJECT', NULL),
('review_13', 'submission_7', '0x9c8d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1', 'APPROVE', NULL),
('review_14', 'submission_7', '0x0d9e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2', 'APPROVE', NULL),
('review_15', 'submission_8', '0x1eaf5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3', 'REJECT', NULL),
('review_16', 'submission_8', '0x2fb06b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4', 'APPROVE', NULL),
('review_17', 'submission_9', '0x3c117c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5', 'APPROVE', NULL),
('review_18', 'submission_9', '0x4d228d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6', 'REJECT', NULL),
('review_19', 'submission_10', '0x5e339e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7', 'APPROVE', NULL),
('review_20', 'submission_10', '0x6f44a0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8', 'APPROVE', NULL);

-- Add more users to reach 50
INSERT INTO users (id, wallet, email) VALUES
('user_16', '0x7f9a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f1', 'user16@example.com'),
('user_17', '0x8b9c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a1', 'user17@example.com'),
('user_18', '0x9c8d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b2', 'user18@example.com'),
('user_19', '0x0d9e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c3', 'user19@example.com'),
('user_20', '0x1eaf5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d4', 'user20@example.com'),
('user_21', '0x2fb06b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e5', 'user21@example.com'),
('user_22', '0x3c117c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f6', 'user22@example.com'),
('user_23', '0x4d228d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a7', 'user23@example.com'),
('user_24', '0x5e339e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b8', 'user24@example.com'),
('user_25', '0x6f44a0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c9', 'user25@example.com'),
('user_26', '0x7f9a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f2', 'user26@example.com'),
('user_27', '0x8b9c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a2', 'user27@example.com'),
('user_28', '0x9c8d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b3', 'user28@example.com'),
('user_29', '0x0d9e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c4', 'user29@example.com'),
('user_30', '0x1eaf5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d5', 'user30@example.com');

-- Add more submissions
INSERT INTO submissions (id, user_id, challenge_id, week_no, file_url, watermark_code, status) VALUES
('submission_11', 'user_16', 'challenge_1', 1, 'https://example.com/files/sub11.mp4', 'watermark_011', 'PENDING'),
('submission_12', 'user_17', 'challenge_2', 2, 'https://example.com/files/sub12.mp4', 'watermark_012', 'APPROVED'),
('submission_13', 'user_18', 'challenge_3', 3, 'https://example.com/files/sub13.mp4', 'watermark_013', 'REJECTED'),
('submission_14', 'user_19', 'challenge_4', 1, 'https://example.com/files/sub14.mp4', 'watermark_014', 'PENDING'),
('submission_15', 'user_20', 'challenge_5', 2, 'https://example.com/files/sub15.mp4', 'watermark_015', 'APPROVED');

-- Add more reviews for new submissions
INSERT INTO reviews (id, submission_id, reviewer_wallet, vote, assignment_id) VALUES
('review_21', 'submission_11', '0x7f9a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0', 'APPROVE', NULL),
('review_22', 'submission_11', '0x8b9c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0', 'APPROVE', NULL),
('review_23', 'submission_12', '0x9c8d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1', 'REJECT', NULL),
('review_24', 'submission_12', '0x0d9e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2', 'APPROVE', NULL),
('review_25', 'submission_13', '0x1eaf5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3', 'APPROVE', NULL);

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
