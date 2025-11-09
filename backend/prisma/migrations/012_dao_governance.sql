-- DAO Governance System Tables

-- Proposals table
CREATE TABLE IF NOT EXISTS dao_proposals (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  proposal_type TEXT NOT NULL, -- 'param_change', 'grant', 'burn_policy', 'treasury_action'
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'active', 'passed', 'rejected', 'executed'
  created_by TEXT NOT NULL REFERENCES users(id),
  votes_for INT NOT NULL DEFAULT 0,
  votes_against INT NOT NULL DEFAULT 0,
  quorum_required INT NOT NULL DEFAULT 3,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  voting_ends_at TIMESTAMP,
  executed_at TIMESTAMP,
  CONSTRAINT valid_status CHECK (status IN ('draft', 'active', 'passed', 'rejected', 'executed'))
);

-- Votes table
CREATE TABLE IF NOT EXISTS dao_votes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  proposal_id TEXT NOT NULL REFERENCES dao_proposals(id) ON DELETE CASCADE,
  voter_wallet TEXT NOT NULL,
  vote TEXT NOT NULL, -- 'for', 'against', 'abstain'
  voting_power INT NOT NULL DEFAULT 1,
  voted_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_vote CHECK (vote IN ('for', 'against', 'abstain')),
  CONSTRAINT unique_vote UNIQUE (proposal_id, voter_wallet)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_dao_proposals_status ON dao_proposals(status);
CREATE INDEX IF NOT EXISTS idx_dao_proposals_created_by ON dao_proposals(created_by);
CREATE INDEX IF NOT EXISTS idx_dao_votes_proposal ON dao_votes(proposal_id);
CREATE INDEX IF NOT EXISTS idx_dao_votes_wallet ON dao_votes(voter_wallet);

-- Comments
COMMENT ON TABLE dao_proposals IS 'DAO governance proposals';
COMMENT ON TABLE dao_votes IS 'Votes on DAO proposals with max 2 votes per wallet enforcement';
COMMENT ON COLUMN dao_proposals.payload IS 'JSON payload with proposal-specific data';
COMMENT ON COLUMN dao_votes.voting_power IS 'Voting power (future: based on staked tokens)';
