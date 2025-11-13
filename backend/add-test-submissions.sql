-- First, let's check if there are any challenges
SELECT id, title FROM challenges LIMIT 5;

-- Add sample submissions for testjames
-- Note: We need challenge_id, week_no (not week_number), and file_url (not proof_url)
INSERT INTO submissions (id, user_id, challenge_id, week_no, file_url, watermark_code, status, created_at) VALUES
('sub1_' || extract(epoch from now())::text, 
 (SELECT id FROM users WHERE handle = 'testjames'), 
 (SELECT id FROM challenges LIMIT 1), 
 1, 
 'https://example.com/proof_1.jpg', 
 'WM' || extract(epoch from now())::text || '1', 
 'APPROVED', 
 now() - interval '21 days'),
('sub2_' || extract(epoch from now())::text, 
 (SELECT id FROM users WHERE handle = 'testjames'), 
 (SELECT id FROM challenges LIMIT 1), 
 2, 
 'https://example.com/proof_2.jpg', 
 'WM' || extract(epoch from now())::text || '2', 
 'APPROVED', 
 now() - interval '14 days'),
('sub3_' || extract(epoch from now())::text, 
 (SELECT id FROM users WHERE handle = 'testjames'), 
 (SELECT id FROM challenges LIMIT 1), 
 3, 
 'https://example.com/proof_3.jpg', 
 'WM' || extract(epoch from now())::text || '3', 
 'PENDING', 
 now() - interval '7 days');

-- Verify submissions were added
SELECT 
  s.id,
  u.handle,
  s.week_no,
  s.status,
  s.created_at
FROM submissions s
JOIN users u ON s.user_id = u.id
WHERE u.handle = 'testjames'
ORDER BY s.week_no;
