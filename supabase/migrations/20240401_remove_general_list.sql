-- Migration to remove the is_general field from the shopping_lists table
ALTER TABLE public.shopping_lists DROP COLUMN IF EXISTS is_general;

-- Update any triggers or functions that might reference is_general
-- (None identified in the current schema)

-- Note: This migration removes the is_general field as it's no longer needed
-- The general list functionality has been removed from the application 