-- Fix security linter warnings by setting search_path for functions

ALTER FUNCTION check_overspending() SET search_path = public;
ALTER FUNCTION check_goal_milestone() SET search_path = public;