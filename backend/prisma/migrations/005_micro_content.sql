-- ============================================
-- GoalCoin Phase 2: Micro-Content Engine
-- ============================================

-- 1. Content items table
CREATE TABLE content_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(20) NOT NULL, -- 'video', 'article', 'challenge', 'tip'
  title VARCHAR(255) NOT NULL,
  description TEXT,
  url TEXT,
  thumbnail_url VARCHAR(500),
  region VARCHAR(50), -- 'global', 'AFR', 'AMER', 'EUAS', or country code
  xp_reward INT DEFAULT 5,
  daily_cap INT DEFAULT 10,
  duration_sec INT, -- For videos
  active BOOLEAN DEFAULT true,
  featured BOOLEAN DEFAULT false,
  view_count INT DEFAULT 0,
  share_count INT DEFAULT 0,
  like_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Content interactions table
CREATE TABLE content_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  content_id UUID NOT NULL,
  action VARCHAR(20) NOT NULL, -- 'view', 'share', 'like', 'comment', 'complete'
  xp_earned INT DEFAULT 0,
  metadata JSONB, -- Additional data (e.g., watch duration, comment text)
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_interaction_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_interaction_content FOREIGN KEY (content_id) REFERENCES content_items(id) ON DELETE CASCADE
);

-- 3. Content action types configuration
CREATE TABLE content_action_config (
  action VARCHAR(20) PRIMARY KEY,
  xp_reward INT NOT NULL,
  daily_cap INT DEFAULT 0,
  description TEXT
);

-- 4. Seed content action config
INSERT INTO content_action_config (action, xp_reward, daily_cap, description) VALUES
('view', 5, 10, 'Watch a video or read an article'),
('share', 10, 5, 'Share content with others'),
('like', 2, 20, 'Like a piece of content'),
('comment', 2, 20, 'Comment on content'),
('complete', 10, 5, 'Complete a challenge or workout');

-- 5. Create indexes
CREATE INDEX idx_content_items_region ON content_items(region, active);
CREATE INDEX idx_content_items_type ON content_items(type, active);
CREATE INDEX idx_content_items_featured ON content_items(featured, active);
CREATE INDEX idx_content_interactions_user ON content_interactions(user_id, created_at DESC);
CREATE INDEX idx_content_interactions_content ON content_interactions(content_id, created_at DESC);
CREATE INDEX idx_content_interactions_action ON content_interactions(action, created_at DESC);

-- 6. Seed sample content
INSERT INTO content_items (type, title, description, url, region, xp_reward, duration_sec) VALUES
('video', 'Morning Warmup Routine', '5-minute energizing warmup to start your day', 'https://example.com/warmup1', 'global', 5, 300),
('video', 'HIIT Cardio Blast', '15-minute high-intensity cardio workout', 'https://example.com/hiit1', 'global', 10, 900),
('article', 'Nutrition Basics for Athletes', 'Essential nutrition guide for peak performance', 'https://example.com/nutrition1', 'global', 5, NULL),
('tip', 'Stay Hydrated', 'Drink water before, during, and after workouts', NULL, 'global', 2, NULL),
('challenge', '30-Day Plank Challenge', 'Build core strength with daily plank progression', 'https://example.com/plank30', 'global', 15, NULL);

-- 7. Create trigger to update content stats
CREATE OR REPLACE FUNCTION update_content_stats_trigger() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.action = 'view' THEN
    UPDATE content_items SET view_count = view_count + 1 WHERE id = NEW.content_id;
  ELSIF NEW.action = 'share' THEN
    UPDATE content_items SET share_count = share_count + 1 WHERE id = NEW.content_id;
  ELSIF NEW.action = 'like' THEN
    UPDATE content_items SET like_count = like_count + 1 WHERE id = NEW.content_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_content_stats
AFTER INSERT ON content_interactions
FOR EACH ROW
EXECUTE FUNCTION update_content_stats_trigger();

COMMENT ON TABLE content_items IS 'Regional video feeds and micro-content';
COMMENT ON TABLE content_interactions IS 'User interactions with content (view, share, like, comment)';
COMMENT ON TABLE content_action_config IS 'XP rewards and daily caps for content actions';
