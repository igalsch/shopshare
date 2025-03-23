-- Drop existing policies
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can create their own shopping lists" ON shopping_lists;
DROP POLICY IF EXISTS "Users can view their own shopping lists" ON shopping_lists;
DROP POLICY IF EXISTS "Users can update their own shopping lists" ON shopping_lists;
DROP POLICY IF EXISTS "Users can delete their own shopping lists" ON shopping_lists;
DROP POLICY IF EXISTS "Users can create items in their lists" ON shopping_items;
DROP POLICY IF EXISTS "Users can view items in their lists" ON shopping_items;
DROP POLICY IF EXISTS "Users can update items in their lists" ON shopping_items;
DROP POLICY IF EXISTS "Users can delete items in their lists" ON shopping_items;
DROP POLICY IF EXISTS "Everyone can view products" ON products;
DROP POLICY IF EXISTS "Everyone can create products" ON products;
DROP POLICY IF EXISTS "Everyone can update products" ON products;
DROP POLICY IF EXISTS "Everyone can delete products" ON products;

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can insert their own profile"
ON users FOR INSERT
WITH CHECK (auth.uid() = id OR auth.role() = 'service_role');

CREATE POLICY "Users can view their own profile"
ON users FOR SELECT
USING (auth.uid() = id OR auth.role() = 'service_role');

CREATE POLICY "Users can update their own profile"
ON users FOR UPDATE
USING (auth.uid() = id OR auth.role() = 'service_role');

-- Create policies for shopping_lists table
CREATE POLICY "Users can create their own shopping lists"
ON shopping_lists FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own shopping lists"
ON shopping_lists FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own shopping lists"
ON shopping_lists FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own shopping lists"
ON shopping_lists FOR DELETE
USING (auth.uid() = user_id);

-- Create policies for shopping_items table
CREATE POLICY "Users can create items in their lists"
ON shopping_items FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM shopping_lists
    WHERE id = shopping_items.list_id
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can view items in their lists"
ON shopping_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM shopping_lists
    WHERE id = shopping_items.list_id
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can update items in their lists"
ON shopping_items FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM shopping_lists
    WHERE id = shopping_items.list_id
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete items in their lists"
ON shopping_items FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM shopping_lists
    WHERE id = shopping_items.list_id
    AND user_id = auth.uid()
  )
);

-- Create policies for products table
CREATE POLICY "Everyone can view products"
ON products FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Everyone can create products"
ON products FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Everyone can update products"
ON products FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Everyone can delete products"
ON products FOR DELETE
TO authenticated
USING (true); 