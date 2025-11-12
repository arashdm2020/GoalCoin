-- Fix audit_logs table foreign key issue
-- Run this to fix the remaining migration issues

-- First, drop the problematic foreign key if it exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'audit_logs_reviewer_id_fkey' 
        AND table_name = 'audit_logs'
    ) THEN
        ALTER TABLE audit_logs DROP CONSTRAINT audit_logs_reviewer_id_fkey;
    END IF;
END $$;

-- Check if reviewer_id column exists, if not add it
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'audit_logs' 
        AND column_name = 'reviewer_id'
    ) THEN
        ALTER TABLE audit_logs ADD COLUMN reviewer_id TEXT;
    END IF;
END $$;

-- Add the foreign key constraint properly
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reviewers') THEN
        ALTER TABLE audit_logs ADD CONSTRAINT audit_logs_reviewer_id_fkey 
        FOREIGN KEY (reviewer_id) REFERENCES reviewers(id);
    END IF;
END $$;

-- Verify all tables exist and are accessible
SELECT 
    t.table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t 
WHERE t.table_schema = 'public' 
AND t.table_type = 'BASE TABLE'
AND t.table_name IN ('reviewers', 'submissions', 'reviews', 'audit_logs')
ORDER BY t.table_name;
