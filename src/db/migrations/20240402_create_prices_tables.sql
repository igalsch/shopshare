-- Create stores table
CREATE TABLE IF NOT EXISTS stores (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  branch_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create prices table
CREATE TABLE IF NOT EXISTS prices (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_code TEXT NOT NULL,
  product_name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  unit_of_measure TEXT,
  update_date TIMESTAMP WITH TIME ZONE NOT NULL,
  manufacturer TEXT,
  manufacturer_description TEXT,
  store_id TEXT NOT NULL REFERENCES stores(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(product_code, store_id)
);

-- Create index for faster searches
CREATE INDEX IF NOT EXISTS idx_prices_product_name ON prices(product_name);
CREATE INDEX IF NOT EXISTS idx_prices_store_id ON prices(store_id); 