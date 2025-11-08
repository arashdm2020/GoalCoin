-- Add password_hash field for email authentication
-- Make wallet optional for hybrid login

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
