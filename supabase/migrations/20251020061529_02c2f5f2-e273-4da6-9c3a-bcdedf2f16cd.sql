-- Drop the existing check constraint
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Add updated check constraint with all notification types
ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check 
CHECK (type IN ('budget', 'goal', 'insight', 'achievement', 'success', 'warning', 'info'));