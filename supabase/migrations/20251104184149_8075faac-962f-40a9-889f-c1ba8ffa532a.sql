-- Create function to auto-allocate 70% of income to top priority goal
CREATE OR REPLACE FUNCTION public.auto_allocate_income_to_goal()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  top_goal_id UUID;
  allocation_amount NUMERIC;
BEGIN
  -- Only process income transactions
  IF NEW.type = 'income' THEN
    -- Get the top priority active goal (oldest active goal)
    SELECT id INTO top_goal_id
    FROM goals
    WHERE user_id = NEW.user_id
      AND status = 'active'
    ORDER BY created_at ASC
    LIMIT 1;
    
    -- If a goal exists, allocate 70% of income to it
    IF top_goal_id IS NOT NULL THEN
      allocation_amount := NEW.amount * 0.7;
      
      UPDATE goals
      SET current_amount = current_amount + allocation_amount
      WHERE id = top_goal_id;
      
      -- Optional: Insert a notification
      INSERT INTO notifications (user_id, type, title, message)
      VALUES (
        NEW.user_id,
        'info',
        '💰 Auto-Allocation',
        '₹' || allocation_amount::TEXT || ' (70% of your income) was automatically added to your top goal!'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to run after transaction insert
DROP TRIGGER IF EXISTS trigger_auto_allocate_income ON transactions;
CREATE TRIGGER trigger_auto_allocate_income
  AFTER INSERT ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION auto_allocate_income_to_goal();