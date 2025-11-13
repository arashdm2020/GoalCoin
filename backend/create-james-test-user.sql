-- Create test user for James UAT testing
-- This user can login without Web3/MetaMask for MVP testing

INSERT INTO users (
    id,
    email,
    password_hash,
    handle,
    wallet,
    country_code,
    tier,
    xp_points,
    goal_points,
    current_streak,
    longest_streak,
    burn_multiplier,
    is_holder,
    micro_goal_points,
    email_verified,
    created_at
) VALUES (
    'james_test_user_' || extract(epoch from now())::text,
    'james.test@goalcoin.com',
    '$2b$10$rQJ8vQZ9X8yF2nK5L7mH4eF.HqY8zG3wP1xR6tN9sM2vB4cA7dE8f', -- password: testpass123
    'jamestest',
    '0x1234567890123456789012345678901234567890', -- Test wallet for UAT
    'US',
    'FAN',
    150,
    75,
    5,
    12,
    1.2,
    true,
    25,
    true,
    now()
) ON CONFLICT (email) DO NOTHING;

-- Add some test activity data for James
INSERT INTO submissions (
    id,
    user_id,
    challenge_id,
    week_no,
    file_url,
    watermark_code,
    status,
    created_at
) 
SELECT 
    'james_submission_' || extract(epoch from now())::text,
    u.id,
    (SELECT id FROM challenges LIMIT 1),
    1,
    'https://example.com/james-test-evidence.jpg',
    'JAMES_TEST_' || extract(epoch from now())::text,
    'APPROVED',
    now()
FROM users u 
WHERE u.email = 'james.test@goalcoin.com'
AND NOT EXISTS (
    SELECT 1 FROM submissions s WHERE s.user_id = u.id
);

-- Verify James test user was created
SELECT 
    id,
    email,
    handle,
    wallet,
    tier,
    xp_points,
    goal_points,
    current_streak,
    created_at
FROM users 
WHERE email = 'james.test@goalcoin.com';
