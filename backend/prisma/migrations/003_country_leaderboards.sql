-- ============================================
-- GoalCoin Phase 2: Country Leaderboards (EWBI Model)
-- ============================================

-- 1. Country statistics table
CREATE TABLE country_stats (
  country_code VARCHAR(2) PRIMARY KEY,
  total_xp BIGINT DEFAULT 0,
  active_users INT DEFAULT 0,
  country_score FLOAT DEFAULT 0,
  season VARCHAR(20) DEFAULT 'SEASON_1',
  buffer_factor INT DEFAULT 500,
  rank INT,
  last_updated TIMESTAMP DEFAULT NOW(),
  CONSTRAINT valid_country_code CHECK (LENGTH(country_code) = 2)
);

-- 2. Seasons configuration
CREATE TABLE seasons (
  id VARCHAR(20) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  region VARCHAR(50), -- 'AFR', 'AMER', 'EUAS', 'WILDCARD'
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  active BOOLEAN DEFAULT true,
  prize_pool_usd FLOAT DEFAULT 0,
  buffer_factor INT DEFAULT 500,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3. User country contributions (daily tracking)
CREATE TABLE country_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  country_code VARCHAR(2) NOT NULL,
  xp_contributed INT NOT NULL,
  contribution_date DATE DEFAULT CURRENT_DATE,
  CONSTRAINT fk_contribution_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, contribution_date)
);

-- 4. Create indexes for performance
CREATE INDEX idx_country_stats_score ON country_stats(country_score DESC);
CREATE INDEX idx_country_stats_season ON country_stats(season, country_score DESC);
CREATE INDEX idx_country_stats_rank ON country_stats(rank);
CREATE INDEX idx_contributions_date ON country_contributions(contribution_date, country_code);
CREATE INDEX idx_contributions_user ON country_contributions(user_id, contribution_date DESC);

-- 5. Seed initial season
INSERT INTO seasons (id, name, region, start_date, end_date, active) VALUES
('SEASON_1', 'Global Launch Season', 'WILDCARD', NOW(), NOW() + INTERVAL '90 days', true);

-- 6. Create function to calculate EWBI score
CREATE OR REPLACE FUNCTION calculate_country_score(
  p_country_code VARCHAR(2),
  p_buffer_factor INT DEFAULT 500
) RETURNS FLOAT AS $$
DECLARE
  v_total_xp BIGINT;
  v_active_users INT;
  v_score FLOAT;
BEGIN
  SELECT total_xp, active_users 
  INTO v_total_xp, v_active_users
  FROM country_stats 
  WHERE country_code = p_country_code;
  
  IF v_total_xp IS NULL THEN
    RETURN 0;
  END IF;
  
  -- EWBI Formula: Country_Score = Σ(User_XP × StreakMult) / √(ActiveUsers + BufferFactor)
  v_score := v_total_xp / SQRT(v_active_users + p_buffer_factor);
  
  RETURN v_score;
END;
$$ LANGUAGE plpgsql;

-- 7. Create trigger to update country score on stats change
CREATE OR REPLACE FUNCTION update_country_score_trigger() RETURNS TRIGGER AS $$
BEGIN
  NEW.country_score := calculate_country_score(NEW.country_code, NEW.buffer_factor);
  NEW.last_updated := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_country_score
BEFORE UPDATE ON country_stats
FOR EACH ROW
WHEN (OLD.total_xp IS DISTINCT FROM NEW.total_xp OR OLD.active_users IS DISTINCT FROM NEW.active_users)
EXECUTE FUNCTION update_country_score_trigger();

-- 8. Create materialized view for leaderboard rankings
CREATE MATERIALIZED VIEW country_leaderboard AS
SELECT 
  country_code,
  total_xp,
  active_users,
  country_score,
  season,
  RANK() OVER (PARTITION BY season ORDER BY country_score DESC) as rank
FROM country_stats
WHERE active_users >= 1000 -- Hide countries with <1000 users
ORDER BY country_score DESC;

CREATE UNIQUE INDEX idx_country_leaderboard_code ON country_leaderboard(country_code);
CREATE INDEX idx_country_leaderboard_season_rank ON country_leaderboard(season, rank);

COMMENT ON TABLE country_stats IS 'Country-level XP statistics and EWBI scores';
COMMENT ON TABLE seasons IS 'Seasonal competition configuration (AFR/AMER/EUAS/WILDCARD)';
COMMENT ON TABLE country_contributions IS 'Daily user XP contributions to their country';
COMMENT ON FUNCTION calculate_country_score IS 'EWBI formula: total_xp / sqrt(active_users + buffer_factor)';
