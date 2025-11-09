-- Add routine_id and duration_seconds to warmup_logs
-- Make session_id optional for catalog-based warmups

ALTER TABLE warmup_logs 
  ADD COLUMN routine_id TEXT NOT NULL DEFAULT 'beginner_5min',
  ADD COLUMN duration_seconds INT NOT NULL DEFAULT 300,
  ALTER COLUMN session_id DROP NOT NULL;

-- Add index for routine_id lookups
CREATE INDEX IF NOT EXISTS idx_warmup_logs_routine ON warmup_logs(routine_id);

COMMENT ON COLUMN warmup_logs.routine_id IS 'ID from warmup catalog (e.g., beginner_5min, intermediate_7min)';
COMMENT ON COLUMN warmup_logs.duration_seconds IS 'Total duration of warmup routine in seconds';
