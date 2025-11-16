-- Add notes column to workout_logs table
ALTER TABLE workout_logs ADD COLUMN IF NOT EXISTS notes TEXT;

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'workout_logs' 
ORDER BY ordinal_position;
