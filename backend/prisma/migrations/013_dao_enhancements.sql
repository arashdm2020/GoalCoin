-- Enhance DAO tables with missing columns

-- Add missing columns to dao_proposals if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='dao_proposals' AND column_name='proposal_type') THEN
        ALTER TABLE dao_proposals ADD COLUMN proposal_type TEXT DEFAULT 'param_change';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='dao_proposals' AND column_name='payload') THEN
        ALTER TABLE dao_proposals ADD COLUMN payload JSONB DEFAULT '{}'::jsonb;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='dao_proposals' AND column_name='quorum_required') THEN
        ALTER TABLE dao_proposals ADD COLUMN quorum_required INT DEFAULT 3;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='dao_proposals' AND column_name='executed_at') THEN
        ALTER TABLE dao_proposals ADD COLUMN executed_at TIMESTAMP NULL;
    END IF;
END $$;

-- Add missing columns to dao_votes if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='dao_votes' AND column_name='voting_power') THEN
        ALTER TABLE dao_votes ADD COLUMN voting_power INT DEFAULT 1;
    END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_dao_proposals_type ON dao_proposals(proposal_type);
CREATE INDEX IF NOT EXISTS idx_dao_proposals_status_v2 ON dao_proposals(status);
