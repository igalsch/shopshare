# ShopShare

A shopping list management application built with React and Supabase.

## Database Migration: Removing General List Functionality

The application has been updated to remove the "general list" functionality. This requires a database migration to remove the `is_general` field from the `shopping_lists` table.

### Option 1: Using the Supabase CLI

1. Make sure you have the Supabase CLI installed: https://supabase.com/docs/guides/cli
2. Login to Supabase CLI: `supabase login`
3. Link your project: `supabase link --project-ref <your-project-ref>`
4. Run the migration: `node scripts/run-migration.js`

### Option 2: Using the Supabase SQL Editor

1. Open the SQL Editor in the Supabase Dashboard
2. Run the following SQL:

```sql
ALTER TABLE public.shopping_lists DROP COLUMN IF EXISTS is_general;
```

## Development

### Installation

```bash
npm install
```

### Running the application

```bash
npm run dev
```

### Building for production

```bash
npm run build
``` #   s h o p s h a r e  
 