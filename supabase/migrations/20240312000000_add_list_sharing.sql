-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view shares for lists they own or have access to" ON list_shares;
DROP POLICY IF EXISTS "List owners can create shares" ON list_shares;
DROP POLICY IF EXISTS "List owners can delete shares" ON list_shares;
DROP POLICY IF EXISTS "Users can view invitations they created" ON share_invitations;
DROP POLICY IF EXISTS "Users can view invitations sent to their email" ON share_invitations;
DROP POLICY IF EXISTS "List owners can create invitations" ON share_invitations;
DROP POLICY IF EXISTS "List owners can update invitations" ON share_invitations;
DROP POLICY IF EXISTS "List owners can delete invitations" ON share_invitations;
DROP POLICY IF EXISTS "Users can view profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view other users profiles" ON auth.users;

-- Drop existing tables if they exist
DROP TABLE IF EXISTS list_shares CASCADE;
DROP TABLE IF EXISTS share_invitations CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create list_shares table
CREATE TABLE IF NOT EXISTS list_shares (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  list_id UUID REFERENCES shopping_lists(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  permission VARCHAR(20) NOT NULL DEFAULT 'read',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(list_id, user_id)
);

-- Create share_invitations table
CREATE TABLE IF NOT EXISTS share_invitations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  list_id UUID REFERENCES shopping_lists(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(list_id, recipient_email, status)
);

-- Helper function to check list access
CREATE OR REPLACE FUNCTION check_list_access(list_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM shopping_lists WHERE id = list_id::UUID AND user_id = user_id::UUID
    UNION
    SELECT 1 FROM list_shares WHERE list_id = list_id::UUID AND user_id = user_id::UUID
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

-- RLS policies for share_invitations
ALTER TABLE share_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view invitations they created"
  ON share_invitations FOR SELECT
  USING (created_by = auth.uid()::UUID);

CREATE POLICY "Users can view invitations sent to their email"
  ON share_invitations FOR SELECT
  USING (
    LOWER(recipient_email) = LOWER((
      SELECT email 
      FROM auth.users 
      WHERE id = auth.uid()::UUID
    ))
  );

CREATE POLICY "List owners can create invitations"
  ON share_invitations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM shopping_lists
      WHERE id = list_id::UUID 
      AND user_id = auth.uid()::UUID
    )
  );

CREATE POLICY "List owners can update invitations"
  ON share_invitations FOR UPDATE
  USING (created_by = auth.uid()::UUID);

CREATE POLICY "List owners can delete invitations"
  ON share_invitations FOR DELETE
  USING (created_by = auth.uid()::UUID);

-- RLS policies for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view profiles"
  ON profiles FOR SELECT
  USING (true);  -- Allow all authenticated users to view profiles

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid()::UUID);

-- RLS policies for auth.users
CREATE POLICY "Users can view other users profiles"
  ON auth.users FOR SELECT
  USING (true);  -- Allow all authenticated users to view user profiles

-- Enable RLS on auth.users
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Create a trigger to sync user email from auth.users to profiles
CREATE OR REPLACE FUNCTION sync_user_email()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS sync_user_email_trigger ON auth.users;
CREATE TRIGGER sync_user_email_trigger
  AFTER INSERT OR UPDATE OF email ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_email(); 