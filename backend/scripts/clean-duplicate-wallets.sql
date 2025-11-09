-- Clean duplicate wallet addresses
-- This script finds and removes duplicate wallet entries
-- Keeps the record with email (if exists) or the oldest record

-- Show duplicates before cleaning
SELECT 
    wallet,
    COUNT(*) as count,
    STRING_AGG(id::text, ', ') as user_ids,
    STRING_AGG(COALESCE(email, 'NO_EMAIL'), ', ') as emails
FROM users
WHERE wallet IS NOT NULL
GROUP BY wallet
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- Clean duplicates (keeps one with email or oldest)
DO $$
DECLARE
    duplicate_wallet TEXT;
    keeper_id TEXT;
    duplicate_ids TEXT[];
    deleted_count INT := 0;
BEGIN
    FOR duplicate_wallet IN 
        SELECT wallet 
        FROM users 
        WHERE wallet IS NOT NULL 
        GROUP BY wallet 
        HAVING COUNT(*) > 1
    LOOP
        -- Find the record to keep
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

        -- Delete duplicates
        IF array_length(duplicate_ids, 1) > 0 THEN
            DELETE FROM users WHERE id = ANY(duplicate_ids);
            deleted_count := deleted_count + array_length(duplicate_ids, 1);
            RAISE NOTICE 'Deleted % duplicate(s) for wallet %, kept user %', 
                array_length(duplicate_ids, 1), duplicate_wallet, keeper_id;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Total deleted: % duplicate records', deleted_count;
END $$;

-- Verify no duplicates remain
SELECT 
    wallet,
    COUNT(*) as count
FROM users
WHERE wallet IS NOT NULL
GROUP BY wallet
HAVING COUNT(*) > 1;

-- If empty result, all duplicates are cleaned!
