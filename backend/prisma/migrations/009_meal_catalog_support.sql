-- Add meal catalog support to meal_logs
-- Make plan_id optional and add meal_id, meal_type, calories, logged_at

ALTER TABLE meal_logs 
  ADD COLUMN meal_id TEXT NOT NULL DEFAULT 'global-lunch-salad',
  ADD COLUMN meal_type TEXT NOT NULL DEFAULT 'lunch',
  ADD COLUMN calories INT NOT NULL DEFAULT 0,
  ADD COLUMN logged_at TIMESTAMP NOT NULL DEFAULT NOW(),
  ALTER COLUMN plan_id DROP NOT NULL;

-- Add index for logged_at lookups
CREATE INDEX IF NOT EXISTS idx_meal_logs_logged_at ON meal_logs(user_id, logged_at);

-- Add index for meal_id lookups
CREATE INDEX IF NOT EXISTS idx_meal_logs_meal_id ON meal_logs(meal_id);

COMMENT ON COLUMN meal_logs.meal_id IS 'ID from meal catalog (e.g., global-breakfast-oatmeal)';
COMMENT ON COLUMN meal_logs.meal_type IS 'Category: breakfast, lunch, dinner, snack';
COMMENT ON COLUMN meal_logs.calories IS 'Calorie count of the meal';
COMMENT ON COLUMN meal_logs.logged_at IS 'When the meal was logged (for daily tracking)';
