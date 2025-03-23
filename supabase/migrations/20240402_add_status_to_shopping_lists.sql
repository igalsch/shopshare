-- Add status column to shopping_lists table
ALTER TABLE shopping_lists ADD COLUMN IF NOT EXISTS status text DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived'));

-- Update existing rows to have 'active' status if null
UPDATE shopping_lists SET status = 'active' WHERE status IS NULL; 