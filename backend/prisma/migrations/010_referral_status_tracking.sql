-- Add status tracking to referrals for leaderboard and prize system

ALTER TABLE referrals 
  ADD COLUMN status TEXT NOT NULL DEFAULT 'signed_up',
  ADD COLUMN activated_at TIMESTAMP NULL;

-- Add indexes for leaderboard queries
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_status ON referrals(referrer_id, status);
CREATE INDEX IF NOT EXISTS idx_referrals_status_created ON referrals(status, created_at);

-- Update existing referrals to 'activated' status (assume they're all activated)
UPDATE referrals SET status = 'activated', activated_at = created_at WHERE status = 'signed_up';

COMMENT ON COLUMN referrals.status IS 'Referral status: signed_up, activated, fraud_flag';
COMMENT ON COLUMN referrals.activated_at IS 'When the referred user completed their first action';
