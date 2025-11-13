-- Create test submission using testjames user
-- First, get a challenge_id (assuming there's at least one challenge)
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
    (SELECT id FROM challenges LIMIT 1), -- Get first available challenge
    1,
    'https://example.com/test-evidence.jpg',
    'TEST_WATERMARK_' || extract(epoch from now())::text,
    'PENDING',
    now()
FROM users u 
WHERE u.handle = 'testjames'
AND NOT EXISTS (
    SELECT 1 FROM submissions s WHERE s.user_id = u.id AND s.week_no = 1
);

-- Verify submission was created
SELECT 
    s.id,
    s.week_no,
    s.file_url,
    s.status,
    u.handle,
    u.wallet,
    s.created_at
FROM submissions s
JOIN users u ON s.user_id = u.id
WHERE u.handle = 'testjames';
