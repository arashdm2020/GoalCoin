-- Admin Reviewer System Tables for GoalCoin
-- Run this script in your PostgreSQL database on Render

-- Create reviewers table
CREATE TABLE IF NOT EXISTS reviewers (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    voting_weight INTEGER DEFAULT 1,
    strikes INTEGER DEFAULT 0,
    status TEXT DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create submissions table
CREATE TABLE IF NOT EXISTS submissions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    status TEXT DEFAULT 'PENDING',
    file_url TEXT,
    thumbnail TEXT,
    description TEXT,
    country_code TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id TEXT PRIMARY KEY,
    submission_id TEXT NOT NULL,
    reviewer_wallet TEXT NOT NULL,
    vote TEXT NOT NULL,
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    reviewer_id TEXT NOT NULL,
    action TEXT NOT NULL,
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS reviewers_user_id_idx ON reviewers(user_id);
CREATE INDEX IF NOT EXISTS reviewers_status_idx ON reviewers(status);
CREATE INDEX IF NOT EXISTS submissions_user_id_idx ON submissions(user_id);
CREATE INDEX IF NOT EXISTS submissions_status_idx ON submissions(status);
CREATE INDEX IF NOT EXISTS reviews_submission_id_idx ON reviews(submission_id);
CREATE INDEX IF NOT EXISTS reviews_reviewer_wallet_idx ON reviews(reviewer_wallet);
CREATE INDEX IF NOT EXISTS audit_logs_reviewer_id_idx ON audit_logs(reviewer_id);

-- Add foreign key constraints (if users table exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        ALTER TABLE reviewers ADD CONSTRAINT reviewers_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id);
        ALTER TABLE submissions ADD CONSTRAINT submissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id);
    END IF;
END $$;

DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'submissions') THEN
        ALTER TABLE reviews ADD CONSTRAINT reviews_submission_id_fkey FOREIGN KEY (submission_id) REFERENCES submissions(id);
    END IF;
END $$;

DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reviewers') THEN
        ALTER TABLE audit_logs ADD CONSTRAINT audit_logs_reviewer_id_fkey FOREIGN KEY (reviewer_id) REFERENCES reviewers(id);
    END IF;
END $$;

-- Verify tables were created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
AND table_name IN ('reviewers', 'submissions', 'reviews', 'audit_logs')
ORDER BY table_name;
