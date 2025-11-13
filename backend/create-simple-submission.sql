-- Check if challenges exist
SELECT COUNT(*) as challenge_count FROM challenges;

-- Check if testjames user exists
SELECT id, handle FROM users WHERE handle = 'testjames';

-- Create a simple challenge first if none exists
INSERT INTO challenges (
    id,
    title,
    description,
    start_date,
    end_date,
    status,
    created_at
) 
SELECT 
    'challenge_test_' || extract(epoch from now())::text,
    'Test Challenge',
    'Test challenge for submissions',
    now(),
    now() + interval '30 days',
    'ACTIVE',
    now()
WHERE NOT EXISTS (SELECT 1 FROM challenges LIMIT 1);

-- Now create test submission
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
    'submission_' || extract(epoch from now())::text,
    u.id,
    c.id,
    1,
    'https://example.com/test-evidence.jpg',
    'TEST_WATERMARK_' || extract(epoch from now())::text,
    'PENDING',
    now()
FROM users u, challenges c
WHERE u.handle = 'testjames'
LIMIT 1;

-- Verify submission was created
SELECT 
    s.id,
    s.week_no,
    s.file_url,
    s.status,
    u.handle,
    c.title as challenge_title,
    s.created_at
FROM submissions s
JOIN users u ON s.user_id = u.id
JOIN challenges c ON s.challenge_id = c.id
WHERE u.handle = 'testjames';
