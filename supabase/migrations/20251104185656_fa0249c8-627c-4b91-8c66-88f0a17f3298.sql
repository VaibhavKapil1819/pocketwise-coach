-- Add streak tracking to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS last_log_date DATE,
ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS longest_streak INTEGER DEFAULT 0;

-- Function to update streak on transaction insert
CREATE OR REPLACE FUNCTION update_user_streak()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  last_log DATE;
  current_streak_val INTEGER;
BEGIN
  -- Get user's last log date and current streak
  SELECT last_log_date, current_streak 
  INTO last_log, current_streak_val
  FROM profiles 
  WHERE id = NEW.user_id;

  -- Update streak logic
  IF last_log IS NULL THEN
    -- First log ever
    UPDATE profiles 
    SET last_log_date = CURRENT_DATE,
        current_streak = 1,
        longest_streak = 1,
        xp = xp + 10
    WHERE id = NEW.user_id;
  ELSIF last_log = CURRENT_DATE THEN
    -- Already logged today, no streak change
    RETURN NEW;
  ELSIF last_log = CURRENT_DATE - INTERVAL '1 day' THEN
    -- Logged yesterday, increment streak
    UPDATE profiles 
    SET last_log_date = CURRENT_DATE,
        current_streak = current_streak + 1,
        longest_streak = GREATEST(longest_streak, current_streak + 1),
        xp = xp + 10
    WHERE id = NEW.user_id;
  ELSE
    -- Streak broken, reset to 1
    UPDATE profiles 
    SET last_log_date = CURRENT_DATE,
        current_streak = 1,
        xp = xp + 10
    WHERE id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for streak updates
DROP TRIGGER IF EXISTS update_streak_on_transaction ON transactions;
CREATE TRIGGER update_streak_on_transaction
  AFTER INSERT ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_user_streak();