-- Fix all users to have country codes
-- Update ALL remaining users without country codes
UPDATE users SET 
    country_code = (ARRAY['US', 'CN', 'JP', 'DE', 'IN', 'GB', 'FR', 'IT', 'BR', 'CA', 'KR', 'RU', 'AU', 'ES', 'MX', 'ID', 'NL', 'SA', 'TR', 'CH', 'TW', 'BE', 'IE', 'IL', 'NO', 'AE', 'EG', 'NG', 'ZA', 'AR', 'TH', 'SG', 'MY', 'PH', 'CL', 'PK', 'BD', 'VN', 'CO', 'PL', 'SE', 'AT', 'DK', 'FI', 'CZ', 'PT', 'GR', 'NZ', 'HU', 'RO'])[floor(random() * 50)],
    handle = 'User' || substring(id, 6)
WHERE country_code IS NULL;

-- Verify all users now have countries
SELECT 
    country_code,
    COUNT(*) as user_count
FROM users 
WHERE country_code IS NOT NULL
GROUP BY country_code 
ORDER BY user_count DESC;

-- Check total users with countries
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN country_code IS NOT NULL THEN 1 END) as users_with_countries,
    COUNT(CASE WHEN country_code IS NULL THEN 1 END) as users_without_countries
FROM users;
