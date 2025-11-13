-- Create test user: testjames
-- Email: testjames@goalcoin.com
-- Password: testpassword123 (hashed with bcrypt)
-- Handle: testjames
-- Wallet: 0x742d35Cc6634C0532925a3b8D404d5B8c4c4c4c4
-- Location: US (United States)

-- Insert test user
INSERT INTO users (
  id,
  email,
  password_hash,
  handle,
  wallet,
  country_code,
  email_verified,
  tier,
  founder_nft,
  xp_points,
  goal_points,
  current_streak,
  longest_streak,
  burn_multiplier,
  is_holder,
  micro_goal_points,
  last_activity_date,
  created_at
) VALUES (
  'testjames_' || extract(epoch from now())::text,
  'testjames@goalcoin.com',
  '$2b$10$IKZJqsnG4NMp4j9FgIdmAeWYMnja7c5im5.QGAB2v4KZ5C5jUd.3u',
  'testjames',
  '0x742d35Cc6634C0532925a3b8D404d5B8c4c4c4c4',
  'US',
  true,
  'PLAYER',
  false,
  2500,
  150,
  12,
  25,
  1.25,
  true,
  75,
  now(),
  '2024-01-15T10:00:00Z'
);

-- Get the user ID for activity data
-- Note: Replace 'USER_ID_HERE' with actual user ID after insertion

-- Add sample warmup logs
INSERT INTO warmup_logs (id, user_id, routine_id, duration_seconds, xp_earned, completed_at) VALUES
('warmup1_' || extract(epoch from now())::text, (SELECT id FROM users WHERE handle = 'testjames'), 'warmup_routine_1', 300, 25, now() - interval '1 day'),
('warmup2_' || extract(epoch from now())::text, (SELECT id FROM users WHERE handle = 'testjames'), 'warmup_routine_2', 330, 25, now() - interval '2 days'),
('warmup3_' || extract(epoch from now())::text, (SELECT id FROM users WHERE handle = 'testjames'), 'warmup_routine_3', 360, 25, now() - interval '3 days'),
('warmup4_' || extract(epoch from now())::text, (SELECT id FROM users WHERE handle = 'testjames'), 'warmup_routine_4', 390, 25, now() - interval '4 days'),
('warmup5_' || extract(epoch from now())::text, (SELECT id FROM users WHERE handle = 'testjames'), 'warmup_routine_5', 420, 25, now() - interval '5 days');

-- Add sample meal logs
INSERT INTO meal_logs (id, user_id, meal_id, meal_type, calories, xp_earned, completed_at) VALUES
('meal1_' || extract(epoch from now())::text, (SELECT id FROM users WHERE handle = 'testjames'), 'meal_1', 'breakfast', 200, 15, now() - interval '12 hours'),
('meal2_' || extract(epoch from now())::text, (SELECT id FROM users WHERE handle = 'testjames'), 'meal_2', 'lunch', 220, 15, now() - interval '24 hours'),
('meal3_' || extract(epoch from now())::text, (SELECT id FROM users WHERE handle = 'testjames'), 'meal_3', 'dinner', 240, 15, now() - interval '36 hours'),
('meal4_' || extract(epoch from now())::text, (SELECT id FROM users WHERE handle = 'testjames'), 'meal_4', 'snack', 260, 15, now() - interval '48 hours'),
('meal5_' || extract(epoch from now())::text, (SELECT id FROM users WHERE handle = 'testjames'), 'meal_5', 'breakfast', 280, 15, now() - interval '60 hours');

-- Add sample workout logs
INSERT INTO workout_logs (id, user_id, workout_type, duration_min, xp_earned, completed_at) VALUES
('workout1_' || extract(epoch from now())::text, (SELECT id FROM users WHERE handle = 'testjames'), 'strength', 45, 50, now() - interval '2 days'),
('workout2_' || extract(epoch from now())::text, (SELECT id FROM users WHERE handle = 'testjames'), 'cardio', 50, 50, now() - interval '4 days'),
('workout3_' || extract(epoch from now())::text, (SELECT id FROM users WHERE handle = 'testjames'), 'strength', 55, 50, now() - interval '6 days'),
('workout4_' || extract(epoch from now())::text, (SELECT id FROM users WHERE handle = 'testjames'), 'cardio', 60, 50, now() - interval '8 days'),
('workout5_' || extract(epoch from now())::text, (SELECT id FROM users WHERE handle = 'testjames'), 'strength', 65, 50, now() - interval '10 days');

-- Add sample submissions
INSERT INTO submissions (id, user_id, week_number, proof_type, proof_url, status, watermark_code, created_at) VALUES
('sub1_' || extract(epoch from now())::text, (SELECT id FROM users WHERE handle = 'testjames'), 1, 'IMAGE', 'https://example.com/proof_1.jpg', 'APPROVED', 'WM' || extract(epoch from now())::text || '1', now() - interval '21 days'),
('sub2_' || extract(epoch from now())::text, (SELECT id FROM users WHERE handle = 'testjames'), 2, 'IMAGE', 'https://example.com/proof_2.jpg', 'APPROVED', 'WM' || extract(epoch from now())::text || '2', now() - interval '14 days'),
('sub3_' || extract(epoch from now())::text, (SELECT id FROM users WHERE handle = 'testjames'), 3, 'IMAGE', 'https://example.com/proof_3.jpg', 'PENDING', 'WM' || extract(epoch from now())::text || '3', now() - interval '7 days');

-- Verify the user was created
SELECT 
  handle,
  email,
  wallet,
  country_code,
  tier,
  xp_points,
  current_streak,
  created_at
FROM users 
WHERE handle = 'testjames';
