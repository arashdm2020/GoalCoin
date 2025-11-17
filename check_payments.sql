-- Check payments table
SELECT COUNT(*) as total_payments FROM payments;

-- Check payment statuses
SELECT status, COUNT(*) as count 
FROM payments 
GROUP BY status;

-- Check payment tiers
SELECT tier, COUNT(*) as count 
FROM payments 
GROUP BY tier;

-- Sample payments
SELECT id, user_id, tier, amount, status, created_at 
FROM payments 
LIMIT 10;
