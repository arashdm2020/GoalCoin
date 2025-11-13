-- Create test reviewer using testjames user
-- Insert reviewer directly
INSERT INTO reviewers (
    id,
    user_id,
    voting_weight,
    strikes,
    status,
    created_at,
    updated_at
) 
SELECT 
    'reviewer_' || extract(epoch from now())::text,
    u.id,
    1.0,
    0,
    'ACTIVE',
    now(),
    now()
FROM users u 
WHERE u.handle = 'testjames'
AND NOT EXISTS (
    SELECT 1 FROM reviewers r WHERE r.user_id = u.id
);

-- Verify reviewer was created
SELECT 
    r.id,
    r.voting_weight,
    r.strikes,
    r.status,
    u.handle,
    u.wallet,
    u.country_code,
    r.created_at
FROM reviewers r
JOIN users u ON r.user_id = u.id
WHERE u.handle = 'testjames';
