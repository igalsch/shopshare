import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// Load environment variables from .env file
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: join(__dirname, '..', '.env') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials in .env file')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function setupDatabase() {
  try {
    // Enable UUID extension
    const { error: uuidError } = await supabase.rpc('exec_sql', {
      sql: 'create extension if not exists "uuid-ossp";'
    })
    if (uuidError) throw uuidError

    // Create users table
    const { error: usersError } = await supabase.rpc('exec_sql', {
      sql: `
        create table if not exists public.users (
          id uuid references auth.users on delete cascade not null primary key,
          full_name text,
          display_name text,
          preferred_theme text default 'מערכת',
          created_at timestamp with time zone default timezone('utc'::text, now()) not null,
          updated_at timestamp with time zone default timezone('utc'::text, now()) not null
        );
      `
    })
    if (usersError) throw usersError

    // Create products table
    const { error: productsError } = await supabase.rpc('exec_sql', {
      sql: `
        create table if not exists public.products (
          id uuid default uuid_generate_v4() primary key,
          name text not null,
          category text,
          created_at timestamp with time zone default timezone('utc'::text, now()) not null,
          updated_at timestamp with time zone default timezone('utc'::text, now()) not null
        );
      `
    })
    if (productsError) throw productsError

    // Create shopping_lists table
    const { error: listsError } = await supabase.rpc('exec_sql', {
      sql: `
        create table if not exists public.shopping_lists (
          id uuid default uuid_generate_v4() primary key,
          name text not null,
          user_id uuid references public.users on delete cascade not null,
          created_at timestamp with time zone default timezone('utc'::text, now()) not null,
          updated_at timestamp with time zone default timezone('utc'::text, now()) not null
        );
      `
    })
    if (listsError) throw listsError

    // Create shopping_items table
    const { error: itemsError } = await supabase.rpc('exec_sql', {
      sql: `
        create table if not exists public.shopping_items (
          id uuid default uuid_generate_v4() primary key,
          list_id uuid references public.shopping_lists on delete cascade not null,
          product_id uuid references public.products on delete cascade not null,
          quantity integer default 1,
          is_checked boolean default false,
          created_at timestamp with time zone default timezone('utc'::text, now()) not null,
          updated_at timestamp with time zone default timezone('utc'::text, now()) not null
        );
      `
    })
    if (itemsError) throw itemsError

    // Enable RLS
    const { error: rlsError } = await supabase.rpc('exec_sql', {
      sql: `
        alter table public.users enable row level security;
        alter table public.products enable row level security;
        alter table public.shopping_lists enable row level security;
        alter table public.shopping_items enable row level security;
      `
    })
    if (rlsError) throw rlsError

    // Create RLS policies
    const { error: policiesError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Users policies
        create policy "Users can view their own data"
          on public.users for select
          using (auth.uid() = id);

        create policy "Users can update their own data"
          on public.users for update
          using (auth.uid() = id);

        -- Products policies
        create policy "Anyone can view products"
          on public.products for select
          using (true);

        create policy "Authenticated users can create products"
          on public.products for insert
          with check (auth.role() = 'authenticated');

        -- Shopping lists policies
        create policy "Users can view their own lists"
          on public.shopping_lists for select
          using (auth.uid() = user_id);

        create policy "Users can create their own lists"
          on public.shopping_lists for insert
          with check (auth.uid() = user_id);

        create policy "Users can update their own lists"
          on public.shopping_lists for update
          using (auth.uid() = user_id);

        create policy "Users can delete their own lists"
          on public.shopping_lists for delete
          using (auth.uid() = user_id);

        -- Shopping items policies
        create policy "Users can view items in their lists"
          on public.shopping_items for select
          using (
            exists (
              select 1 from public.shopping_lists
              where shopping_lists.id = shopping_items.list_id
              and shopping_lists.user_id = auth.uid()
            )
          );

        create policy "Users can create items in their lists"
          on public.shopping_items for insert
          with check (
            exists (
              select 1 from public.shopping_lists
              where shopping_lists.id = shopping_items.list_id
              and shopping_lists.user_id = auth.uid()
            )
          );

        create policy "Users can update items in their lists"
          on public.shopping_items for update
          using (
            exists (
              select 1 from public.shopping_lists
              where shopping_lists.id = shopping_items.list_id
              and shopping_lists.user_id = auth.uid()
            )
          );

        create policy "Users can delete items in their lists"
          on public.shopping_items for delete
          using (
            exists (
              select 1 from public.shopping_lists
              where shopping_lists.id = shopping_items.list_id
              and shopping_lists.user_id = auth.uid()
            )
          );
      `
    })
    if (policiesError) throw policiesError

    // Create updated_at trigger function
    const { error: triggerFunctionError } = await supabase.rpc('exec_sql', {
      sql: `
        create or replace function public.handle_updated_at()
        returns trigger as $$
        begin
          new.updated_at = timezone('utc'::text, now());
          return new;
        end;
        $$ language plpgsql;
      `
    })
    if (triggerFunctionError) throw triggerFunctionError

    // Create triggers
    const { error: triggersError } = await supabase.rpc('exec_sql', {
      sql: `
        create trigger handle_users_updated_at
          before update on public.users
          for each row
          execute function public.handle_updated_at();

        create trigger handle_products_updated_at
          before update on public.products
          for each row
          execute function public.handle_updated_at();

        create trigger handle_shopping_lists_updated_at
          before update on public.shopping_lists
          for each row
          execute function public.handle_updated_at();

        create trigger handle_shopping_items_updated_at
          before update on public.shopping_items
          for each row
          execute function public.handle_updated_at();
      `
    })
    if (triggersError) throw triggersError

    console.log('Database setup completed successfully')
    return true
  } catch (error) {
    console.error('Error setting up database:', error)
    return false
  }
}

console.log('Starting database setup...')
setupDatabase()
  .then(success => {
    if (success) {
      console.log('Database setup completed successfully')
    } else {
      console.error('Database setup failed')
      process.exit(1)
    }
  })
  .catch(error => {
    console.error('Error during database setup:', error)
    process.exit(1)
  }) 