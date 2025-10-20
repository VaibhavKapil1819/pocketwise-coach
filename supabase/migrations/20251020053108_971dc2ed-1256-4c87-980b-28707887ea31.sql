-- Ensure notifications can be inserted by triggers
-- Add a policy to allow system (triggers) to insert notifications
CREATE POLICY "System can insert notifications"
ON public.notifications
FOR INSERT
WITH CHECK (true);

-- Recreate the goal milestone trigger to ensure it works
DROP TRIGGER IF EXISTS goal_milestone_notification ON public.goals;

CREATE TRIGGER goal_milestone_notification
  AFTER UPDATE ON public.goals
  FOR EACH ROW
  WHEN (OLD.current_amount IS DISTINCT FROM NEW.current_amount)
  EXECUTE FUNCTION public.check_goal_milestone();

-- Recreate the overspending trigger
DROP TRIGGER IF EXISTS overspending_notification ON public.transactions;

CREATE TRIGGER overspending_notification
  AFTER INSERT ON public.transactions
  FOR EACH ROW
  WHEN (NEW.type = 'expense')
  EXECUTE FUNCTION public.check_overspending();