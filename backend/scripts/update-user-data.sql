-- Update users with country codes and handles
-- First 20 users with specific data
UPDATE users SET 
    country_code = 'US',
    handle = 'FitAthlete1234'
WHERE id = 'user_1';

UPDATE users SET 
    country_code = 'CN',
    handle = 'StrongChampion5678'
WHERE id = 'user_2';

UPDATE users SET 
    country_code = 'JP',
    handle = 'ActiveWarrior9012'
WHERE id = 'user_3';

UPDATE users SET 
    country_code = 'DE',
    handle = 'HealthyHero3456'
WHERE id = 'user_4';

UPDATE users SET 
    country_code = 'IN',
    handle = 'EnergyStar7890'
WHERE id = 'user_5';

UPDATE users SET 
    country_code = 'GB',
    handle = 'PowerMaster2345'
WHERE id = 'user_6';

UPDATE users SET 
    country_code = 'FR',
    handle = 'SpeedLegend6789'
WHERE id = 'user_7';

UPDATE users SET 
    country_code = 'IT',
    handle = 'AgilePro0123'
WHERE id = 'user_8';

UPDATE users SET 
    country_code = 'BR',
    handle = 'DynamicExpert4567'
WHERE id = 'user_9';

UPDATE users SET 
    country_code = 'CA',
    handle = 'EliteGuru8901'
WHERE id = 'user_10';

UPDATE users SET 
    country_code = 'KR',
    handle = 'FitnessMaster11'
WHERE id = 'user_11';

UPDATE users SET 
    country_code = 'RU',
    handle = 'StrengthExpert12'
WHERE id = 'user_12';

UPDATE users SET 
    country_code = 'AU',
    handle = 'CardioChampion13'
WHERE id = 'user_13';

UPDATE users SET 
    country_code = 'ES',
    handle = 'FlexibilityPro14'
WHERE id = 'user_14';

UPDATE users SET 
    country_code = 'MX',
    handle = 'EnduranceGuru15'
WHERE id = 'user_15';

UPDATE users SET 
    country_code = 'ID',
    handle = 'PowerAthlete16'
WHERE id = 'user_16';

UPDATE users SET 
    country_code = 'NL',
    handle = 'SpeedMaster17'
WHERE id = 'user_17';

UPDATE users SET 
    country_code = 'SA',
    handle = 'AgilityExpert18'
WHERE id = 'user_18';

UPDATE users SET 
    country_code = 'TR',
    handle = 'BalancePro19'
WHERE id = 'user_19';

UPDATE users SET 
    country_code = 'CH',
    handle = 'EliteAthlete20'
WHERE id = 'user_20';

-- Update remaining 480 users with random country codes and handles
UPDATE users SET 
    country_code = (ARRAY['US', 'CN', 'JP', 'DE', 'IN', 'GB', 'FR', 'IT', 'BR', 'CA', 'KR', 'RU', 'AU', 'ES', 'MX', 'ID', 'NL', 'SA', 'TR', 'CH', 'TW', 'BE', 'IE', 'IL', 'NO', 'AE', 'EG', 'NG', 'ZA', 'AR', 'TH', 'SG', 'MY', 'PH', 'CL', 'PK', 'BD', 'VN', 'CO', 'PL', 'SE', 'AT', 'DK', 'FI', 'CZ', 'PT', 'GR', 'NZ', 'HU', 'RO'])[floor(random() * 50)],
    handle = 'User' || id
WHERE id NOT IN ('user_1', 'user_2', 'user_3', 'user_4', 'user_5', 'user_6', 'user_7', 'user_8', 'user_9', 'user_10', 'user_11', 'user_12', 'user_13', 'user_14', 'user_15', 'user_16', 'user_17', 'user_18', 'user_19', 'user_20');

-- Verify the updates
SELECT 
    id,
    wallet,
    email,
    handle,
    country_code,
    xp_points,
    goal_points
FROM users 
WHERE id IN ('user_1', 'user_2', 'user_3', 'user_4', 'user_5')
ORDER BY id;

-- Count users by country
SELECT 
    country_code,
    COUNT(*) as user_count
FROM users 
WHERE country_code IS NOT NULL
GROUP BY country_code 
ORDER BY user_count DESC;
