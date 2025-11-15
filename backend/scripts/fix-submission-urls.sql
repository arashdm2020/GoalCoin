-- Fix submission URLs by replacing example.com with valid avatar URLs
-- This will update all submissions to use random avatar images

UPDATE submissions
SET file_url = CASE 
    WHEN random() < 0.25 THEN 'https://avatar.iran.liara.run/public/14'
    WHEN random() < 0.50 THEN 'https://avatar.iran.liara.run/public/38'
    WHEN random() < 0.75 THEN 'https://avatar.iran.liara.run/public/68'
    ELSE 'https://avatar.iran.liara.run/public/100'
END
WHERE file_url LIKE '%example.com%';

-- Show results
SELECT 
    COUNT(*) as total_updated,
    COUNT(CASE WHEN file_url LIKE '%avatar.iran.liara.run%' THEN 1 END) as with_avatar_urls
FROM submissions;
