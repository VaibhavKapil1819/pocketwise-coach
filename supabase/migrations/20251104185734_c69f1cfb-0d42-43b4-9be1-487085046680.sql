-- Fix search_path security warnings for existing functions

-- Fix check_goal_milestone function
CREATE OR REPLACE FUNCTION public.check_goal_milestone()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  progress_percentage NUMERIC;
  goal_title TEXT;
BEGIN
  -- Calculate progress percentage
  progress_percentage := (NEW.current_amount / NEW.target_amount) * 100;
  
  -- Get goal title
  SELECT title INTO goal_title FROM goals WHERE id = NEW.id;

  -- Send notifications at key milestones
  IF OLD.current_amount < NEW.target_amount * 0.25 AND NEW.current_amount >= NEW.target_amount * 0.25 THEN
    INSERT INTO notifications (user_id, type, title, message)
    VALUES (
      NEW.user_id,
      'success',
      '🎯 Goal Progress: 25%',
      'Great start! You''ve reached 25% of your "' || goal_title || '" goal!'
    );
  ELSIF OLD.current_amount < NEW.target_amount * 0.5 AND NEW.current_amount >= NEW.target_amount * 0.5 THEN
    INSERT INTO notifications (user_id, type, title, message)
    VALUES (
      NEW.user_id,
      'success',
      '🎯 Goal Progress: 50%',
      'Halfway there! You''re doing amazing on "' || goal_title || '"!'
    );
  ELSIF OLD.current_amount < NEW.target_amount * 0.75 AND NEW.current_amount >= NEW.target_amount * 0.75 THEN
    INSERT INTO notifications (user_id, type, title, message)
    VALUES (
      NEW.user_id,
      'success',
      '🎯 Goal Progress: 75%',
      'Almost there! Just 25% more to reach "' || goal_title || '"!'
    );
  ELSIF OLD.current_amount < NEW.target_amount AND NEW.current_amount >= NEW.target_amount THEN
    INSERT INTO notifications (user_id, type, title, message)
    VALUES (
      NEW.user_id,
      'success',
      '🎉 Goal Achieved!',
      'Congratulations! You''ve reached your "' || goal_title || '" goal of ₹' || NEW.target_amount::TEXT || '!'
    );
  END IF;

  RETURN NEW;
END;
$function$;

-- Fix check_overspending function
CREATE OR REPLACE FUNCTION public.check_overspending()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  monthly_budget NUMERIC := 50000;
  total_spent NUMERIC;
  category_name TEXT;
BEGIN
  -- Get category name
  SELECT name INTO category_name FROM categories WHERE id = NEW.category_id;
  
  -- Calculate total spending this month for the user
  SELECT COALESCE(SUM(amount), 0) INTO total_spent
  FROM transactions
  WHERE user_id = NEW.user_id
    AND type = 'expense'
    AND date >= DATE_TRUNC('month', CURRENT_DATE);

  -- Check if overspending (80% of budget)
  IF total_spent > (monthly_budget * 0.8) THEN
    INSERT INTO notifications (user_id, type, title, message)
    VALUES (
      NEW.user_id,
      'warning',
      '⚠️ Overspending Alert',
      'You''ve spent ₹' || total_spent::TEXT || ' this month (80% of typical budget). Consider reviewing your expenses.'
    );
  END IF;

  RETURN NEW;
END;
$function$;