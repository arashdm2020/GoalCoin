    -- Seed 230 commission records with realistic data
-- Clean existing commissions
DELETE FROM commissions;

-- Create 230 commissions with varied amounts based on system logic
-- Commission amounts: $0.50 to $5.00 USDT based on submission complexity and reviewer performance

-- First batch: 50 commissions with higher amounts (experienced reviewers)
INSERT INTO commissions (id, reviewer_wallet, submission_id, amount_usdt, earned_at, payout_id) VALUES
('comm_001', (SELECT wallet FROM users WHERE id = 'user_1'), 'submission_1', 4.75, NOW() - INTERVAL '45 days', NULL),
('comm_002', (SELECT wallet FROM users WHERE id = 'user_2'), 'submission_2', 4.25, NOW() - INTERVAL '44 days', NULL),
('comm_003', (SELECT wallet FROM users WHERE id = 'user_3'), 'submission_3', 3.80, NOW() - INTERVAL '43 days', NULL),
('comm_004', (SELECT wallet FROM users WHERE id = 'user_4'), 'submission_4', 4.50, NOW() - INTERVAL '42 days', NULL),
('comm_005', (SELECT wallet FROM users WHERE id = 'user_5'), 'submission_5', 3.95, NOW() - INTERVAL '41 days', NULL),
('comm_006', (SELECT wallet FROM users WHERE id = 'user_1'), 'submission_6', 4.10, NOW() - INTERVAL '40 days', NULL),
('comm_007', (SELECT wallet FROM users WHERE id = 'user_2'), 'submission_7', 3.75, NOW() - INTERVAL '39 days', NULL),
('comm_008', (SELECT wallet FROM users WHERE id = 'user_3'), 'submission_8', 4.30, NOW() - INTERVAL '38 days', NULL),
('comm_009', (SELECT wallet FROM users WHERE id = 'user_4'), 'submission_9', 3.60, NOW() - INTERVAL '37 days', NULL),
('comm_010', (SELECT wallet FROM users WHERE id = 'user_5'), 'submission_10', 4.85, NOW() - INTERVAL '36 days', NULL);

-- Second batch: 80 commissions with medium amounts (regular reviewers)
INSERT INTO commissions (id, reviewer_wallet, submission_id, amount_usdt, earned_at, payout_id)
SELECT 
    'comm_' || lpad((g + 10)::text, 3, '0'),
    (SELECT wallet FROM users WHERE id = 'user_' || (((g - 1) % 10) + 1)),
    'submission_' || ((g % 15) + 1),
    ROUND((2.0 + (random() * 1.5))::numeric, 2), -- $2.00 to $3.50
    NOW() - (random() * 35 || ' days')::INTERVAL,
    CASE WHEN random() > 0.7 THEN 'payout_' || (g % 5 + 1) ELSE NULL END
FROM generate_series(1, 80) g;

-- Third batch: 100 commissions with lower amounts (new reviewers)
INSERT INTO commissions (id, reviewer_wallet, submission_id, amount_usdt, earned_at, payout_id)
SELECT 
    'comm_' || lpad((g + 90)::text, 3, '0'),
    (SELECT wallet FROM users WHERE id = 'user_' || (((g - 1) % 10) + 1)),
    'submission_' || ((g % 15) + 1),
    ROUND((0.75 + (random() * 1.25))::numeric, 2), -- $0.75 to $2.00
    NOW() - (random() * 30 || ' days')::INTERVAL,
    CASE WHEN random() > 0.8 THEN 'payout_' || (g % 3 + 1) ELSE NULL END
FROM generate_series(1, 100) g;

-- Create some recent high-value commissions (special cases)
INSERT INTO commissions (id, reviewer_wallet, submission_id, amount_usdt, earned_at, payout_id) VALUES
('comm_191', (SELECT wallet FROM users WHERE id = 'user_1'), 'submission_1', 7.50, NOW() - INTERVAL '5 days', NULL),
('comm_192', (SELECT wallet FROM users WHERE id = 'user_2'), 'submission_2', 6.25, NOW() - INTERVAL '4 days', NULL),
('comm_193', (SELECT wallet FROM users WHERE id = 'user_3'), 'submission_3', 8.00, NOW() - INTERVAL '3 days', NULL),
('comm_194', (SELECT wallet FROM users WHERE id = 'user_4'), 'submission_4', 5.75, NOW() - INTERVAL '2 days', NULL),
('comm_195', (SELECT wallet FROM users WHERE id = 'user_5'), 'submission_5', 6.80, NOW() - INTERVAL '1 day', NULL);

-- Create bonus commissions for exceptional reviews
INSERT INTO commissions (id, reviewer_wallet, submission_id, amount_usdt, earned_at, payout_id)
SELECT 
    'comm_' || lpad((g + 195)::text, 3, '0'),
    (SELECT wallet FROM users WHERE id = 'user_' || (((g - 1) % 5) + 1)),
    'submission_' || ((g % 10) + 1),
    ROUND((5.0 + (random() * 3.0))::numeric, 2), -- $5.00 to $8.00 (bonus amounts)
    NOW() - (random() * 7 || ' days')::INTERVAL,
    NULL -- Recent, not paid yet
FROM generate_series(1, 35) g;

-- Summary statistics
SELECT 
    'Total Commissions' as metric,
    COUNT(*) as count,
    ROUND(SUM(amount_usdt)::numeric, 2) as total_amount,
    ROUND(AVG(amount_usdt)::numeric, 2) as avg_amount,
    ROUND(MIN(amount_usdt)::numeric, 2) as min_amount,
    ROUND(MAX(amount_usdt)::numeric, 2) as max_amount
FROM commissions

UNION ALL

SELECT 
    'Paid Commissions' as metric,
    COUNT(*) as count,
    ROUND(SUM(amount_usdt)::numeric, 2) as total_amount,
    ROUND(AVG(amount_usdt)::numeric, 2) as avg_amount,
    ROUND(MIN(amount_usdt)::numeric, 2) as min_amount,
    ROUND(MAX(amount_usdt)::numeric, 2) as max_amount
FROM commissions 
WHERE payout_id IS NOT NULL

UNION ALL

SELECT 
    'Unpaid Commissions' as metric,
    COUNT(*) as count,
    ROUND(SUM(amount_usdt)::numeric, 2) as total_amount,
    ROUND(AVG(amount_usdt)::numeric, 2) as avg_amount,
    ROUND(MIN(amount_usdt)::numeric, 2) as min_amount,
    ROUND(MAX(amount_usdt)::numeric, 2) as max_amount
FROM commissions 
WHERE payout_id IS NULL;

-- Commission distribution by reviewer
SELECT 
    reviewer_wallet,
    COUNT(*) as commission_count,
    ROUND(SUM(amount_usdt)::numeric, 2) as total_earned,
    ROUND(AVG(amount_usdt)::numeric, 2) as avg_commission
FROM commissions 
GROUP BY reviewer_wallet 
ORDER BY total_earned DESC 
LIMIT 10;
