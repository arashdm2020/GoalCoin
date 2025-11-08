-- Add all MVP features: Hybrid Auth, Shopify, Staking
-- Run this after the fitness features migration

-- 1. Add password_hash for email authentication
ALTER TABLE users 
  ALTER COLUMN wallet DROP NOT NULL;

ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Add index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email) WHERE email IS NOT NULL;

-- Add constraint: user must have either wallet or email
ALTER TABLE users 
  ADD CONSTRAINT user_must_have_wallet_or_email 
  CHECK (wallet IS NOT NULL OR email IS NOT NULL);

-- 2. Create Shopify Redemptions table
CREATE TABLE IF NOT EXISTS shopify_redemptions (
  id TEXT PRIMARY KEY,
  order_code TEXT UNIQUE NOT NULL,
  user_id TEXT NOT NULL,
  redeemed_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shopify_redemptions_order_code 
  ON shopify_redemptions(order_code);

-- 3. Create Test Stakes table (for Mumbai testnet)
CREATE TABLE IF NOT EXISTS test_stakes (
  id TEXT PRIMARY KEY,
  wallet TEXT NOT NULL,
  amount_usd DOUBLE PRECISION NOT NULL,
  network TEXT NOT NULL,
  status TEXT NOT NULL,
  tx_hash TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  unstaked_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_test_stakes_wallet 
  ON test_stakes(wallet);

CREATE INDEX IF NOT EXISTS idx_test_stakes_status 
  ON test_stakes(status);
