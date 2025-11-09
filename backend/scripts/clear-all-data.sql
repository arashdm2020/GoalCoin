-- ============================================
-- Clear All Data from GoalCoin Database
-- Keeps table structure, removes all rows
-- ============================================

-- Disable foreign key checks temporarily
SET session_replication_role = 'replica';

-- Phase 2 Tables (newest)
TRUNCATE TABLE content_interactions CASCADE;
TRUNCATE TABLE content_action_config CASCADE;
TRUNCATE TABLE content_items CASCADE;
TRUNCATE TABLE tier_progression_history CASCADE;
TRUNCATE TABLE fan_tier_config CASCADE;
TRUNCATE TABLE country_contributions CASCADE;
TRUNCATE TABLE seasons CASCADE;
TRUNCATE TABLE country_stats CASCADE;
TRUNCATE TABLE xp_events CASCADE;
TRUNCATE TABLE action_types CASCADE;
TRUNCATE TABLE action_type_changes CASCADE;

-- Phase 1 Tables
TRUNCATE TABLE test_stakes CASCADE;
TRUNCATE TABLE shopify_redemptions CASCADE;
TRUNCATE TABLE burn_events CASCADE;
TRUNCATE TABLE dao_proposals CASCADE;
TRUNCATE TABLE dao_votes CASCADE;
TRUNCATE TABLE ad_views CASCADE;
TRUNCATE TABLE referrals CASCADE;
TRUNCATE TABLE diet_logs CASCADE;
TRUNCATE TABLE workout_logs CASCADE;
TRUNCATE TABLE warmup_logs CASCADE;
TRUNCATE TABLE audit_logs CASCADE;
TRUNCATE TABLE payouts CASCADE;
TRUNCATE TABLE commissions CASCADE;
TRUNCATE TABLE reviews CASCADE;
TRUNCATE TABLE submissions CASCADE;
TRUNCATE TABLE payments CASCADE;
TRUNCATE TABLE challenges CASCADE;
TRUNCATE TABLE users CASCADE;

-- Re-enable foreign key checks
SET session_replication_role = 'origin';

-- Reseed essential data
-- 1. Action types
INSERT INTO action_types (action_key, xp_value, cooldown_sec, daily_cap, description) VALUES
('warmup_session', 10, 3600, 3, 'Complete a warmup session'),
('workout_cardio', 20, 3600, 2, 'Complete cardio workout'),
('workout_strength', 25, 3600, 2, 'Complete strength workout'),
('workout_flexibility', 15, 3600, 2, 'Complete flexibility workout'),
('meal_log', 15, 14400, 3, 'Log a healthy meal'),
('referral_signup', 50, 0, 0, 'Successful referral signup'),
('referral_activation', 50, 0, 0, 'Referral completes first workout'),
('content_watch', 5, 300, 10, 'Watch video content'),
('content_share', 10, 600, 5, 'Share content'),
('content_like', 2, 60, 20, 'Like content'),
('content_comment', 2, 60, 20, 'Comment on content'),
('submission_approved', 100, 0, 1, 'Weekly submission approved'),
('submission_streak_7', 50, 0, 0, '7-day submission streak bonus'),
('submission_streak_30', 200, 0, 0, '30-day submission streak bonus'),
('daily_login', 5, 86400, 1, 'Daily login bonus'),
('profile_complete', 25, 0, 1, 'Complete user profile'),
('first_workout', 50, 0, 1, 'First workout completed');

-- 2. Fan tier config
INSERT INTO fan_tier_config (tier, min_xp, max_xp, badge_url, burn_multiplier_bonus, description, color, icon) VALUES
('ROOKIE', 0, 999, '/badges/rookie.svg', 0.01, 'Just getting started on your fitness journey', 'gray', '🌱'),
('SUPPORTER', 1000, 4999, '/badges/supporter.svg', 0.02, 'Committed to the journey', 'green', '💪'),
('PRO', 5000, 14999, '/badges/pro.svg', 0.03, 'Serious athlete with consistent progress', 'blue', '🏆'),
('ELITE', 15000, 49999, '/badges/elite.svg', 0.04, 'Top performer in the community', 'purple', '⭐'),
('LEGEND', 50000, NULL, '/badges/legend.svg', 0.05, 'Hall of fame - Ultimate dedication', 'gold', '👑');

-- 3. Content action config
INSERT INTO content_action_config (action, xp_reward, daily_cap, description) VALUES
('view', 5, 10, 'Watch a video or read an article'),
('share', 10, 5, 'Share content with others'),
('like', 2, 20, 'Like a piece of content'),
('comment', 2, 20, 'Comment on content'),
('complete', 10, 5, 'Complete a challenge or workout');

-- 4. Sample content items
INSERT INTO content_items (type, title, description, url, region, xp_reward, duration_sec) VALUES
('video', 'Morning Warmup Routine', '5-minute energizing warmup to start your day', 'https://example.com/warmup1', 'global', 5, 300),
('video', 'HIIT Cardio Blast', '15-minute high-intensity cardio workout', 'https://example.com/hiit1', 'global', 10, 900),
('article', 'Nutrition Basics for Athletes', 'Essential nutrition guide for peak performance', 'https://example.com/nutrition1', 'global', 5, NULL),
('tip', 'Stay Hydrated', 'Drink water before, during, and after workouts', NULL, 'global', 2, NULL),
('challenge', '30-Day Plank Challenge', 'Build core strength with daily plank progression', 'https://example.com/plank30', 'global', 15, NULL);

-- 5. Initial season
INSERT INTO seasons (id, name, region, start_date, end_date, active) VALUES
('SEASON_1', 'Global Launch Season', 'WILDCARD', NOW(), NOW() + INTERVAL '90 days', true);

-- Verification
SELECT 'action_types' as table_name, COUNT(*) as rows FROM action_types
UNION ALL
SELECT 'fan_tier_config', COUNT(*) FROM fan_tier_config
UNION ALL
SELECT 'content_action_config', COUNT(*) FROM content_action_config
UNION ALL
SELECT 'content_items', COUNT(*) FROM content_items
UNION ALL
SELECT 'seasons', COUNT(*) FROM seasons
UNION ALL
SELECT 'users', COUNT(*) FROM users
UNION ALL
SELECT 'challenges', COUNT(*) FROM challenges
UNION ALL
SELECT 'submissions', COUNT(*) FROM submissions;

-- Success message
SELECT '✅ All data cleared successfully! Essential seed data restored.' as status;
