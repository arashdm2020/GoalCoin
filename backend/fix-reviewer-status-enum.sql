-- Create ReviewerStatus enum if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ReviewerStatus') THEN
        CREATE TYPE "ReviewerStatus" AS ENUM ('ACTIVE', 'SUSPENDED');
    END IF;
END $$;

-- Check current status column type
SELECT column_name, data_type, udt_name 
FROM information_schema.columns 
WHERE table_name = 'reviewers' AND column_name = 'status';

-- If status column is text, alter it to use enum
DO $$
BEGIN
    -- First check if column exists and is text type
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'reviewers' 
        AND column_name = 'status' 
        AND data_type = 'text'
    ) THEN
        -- Update any invalid values to ACTIVE first
        UPDATE reviewers SET status = 'ACTIVE' WHERE status NOT IN ('ACTIVE', 'SUSPENDED');
        
        -- Alter column to use enum
        ALTER TABLE reviewers ALTER COLUMN status TYPE "ReviewerStatus" USING status::"ReviewerStatus";
    END IF;
END $$;

-- Verify the change
SELECT column_name, data_type, udt_name 
FROM information_schema.columns 
WHERE table_name = 'reviewers' AND column_name = 'status';
