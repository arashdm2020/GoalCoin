-- Fix wallet uniqueness issue
-- Step 1: Find and merge duplicate wallets (keep the one with email, or the oldest)

-- First, let's see what duplicates we have
DO $$
DECLARE
    duplicate_wallet TEXT;
    keeper_id TEXT;
    duplicate_ids TEXT[];
BEGIN
    -- Loop through each duplicate wallet
    FOR duplicate_wallet IN 
        SELECT wallet 
        FROM users 
        WHERE wallet IS NOT NULL 
        GROUP BY wallet 
        HAVING COUNT(*) > 1
    LOOP
        -- Find the record to keep (prefer one with email, then oldest)
        SELECT id INTO keeper_id
        FROM users
        WHERE wallet = duplicate_wallet
        ORDER BY 
            CASE WHEN email IS NOT NULL THEN 0 ELSE 1 END,
            created_at ASC
        LIMIT 1;

        -- Get IDs of duplicates to delete
        SELECT ARRAY_AGG(id) INTO duplicate_ids
        FROM users
        WHERE wallet = duplicate_wallet AND id != keeper_id;

        -- Delete duplicate records
        IF array_length(duplicate_ids, 1) > 0 THEN
            DELETE FROM users WHERE id = ANY(duplicate_ids);
            RAISE NOTICE 'Deleted % duplicate records for wallet %', array_length(duplicate_ids, 1), duplicate_wallet;
        END IF;
    END LOOP;
END $$;

-- Step 2: Add UNIQUE constraint on wallet column
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_wallet_key;
ALTER TABLE users ADD CONSTRAINT users_wallet_key UNIQUE (wallet);

-- Step 3: Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_wallet ON users(wallet) WHERE wallet IS NOT NULL;

COMMENT ON CONSTRAINT users_wallet_key ON users IS 'Ensures wallet addresses are unique across all users';
