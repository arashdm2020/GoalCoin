-- Settings table for app configuration
CREATE TABLE app_settings (
  key VARCHAR(100) PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMP DEFAULT NOW(),
  updated_by VARCHAR(255)
);

-- Insert default timer settings
INSERT INTO app_settings (key, value, description) VALUES
('countdown_target_date', '2025-12-31T23:59:59Z', 'Target date for homepage countdown timer'),
('countdown_title', 'Launch Countdown', 'Title displayed above countdown'),
('countdown_enabled', 'true', 'Enable/disable countdown timer on homepage');

COMMENT ON TABLE app_settings IS 'Application-wide settings and configuration';
