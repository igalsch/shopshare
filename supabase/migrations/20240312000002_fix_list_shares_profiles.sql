-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view shares for lists they own or have access to" ON list_shares;

-- Recreate list_shares table with explicit reference to profiles
DROP TABLE IF EXISTS list_shares CASCADE;

CREATE TABLE IF NOT EXISTS list_shares (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  list_id UUID REFERENCES shopping_lists(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  permission VARCHAR(20) NOT NULL DEFAULT 'read',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(list_id, user_id)
);

-- RLS policies for list_shares
ALTER TABLE list_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view shares for lists they own or have access to"
  ON list_shares FOR SELECT
  USING (
    check_list_access(list_id::UUID, auth.uid()::UUID)
  );

CREATE POLICY "List owners can create shares"
  ON list_shares FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM shopping_lists
      WHERE id = list_id::UUID AND user_id = auth.uid()::UUID
    )
  );

CREATE POLICY "List owners can delete shares"
  ON list_shares FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM shopping_lists
      WHERE id = list_id::UUID AND user_id = auth.uid()::UUID
    )
  ); 