/**
 * Script to help run the migration to remove the is_general field from the shopping_lists table
 * 
 * To run this script:
 * 1. Make sure you have the Supabase CLI installed: https://supabase.com/docs/guides/cli
 * 2. Login to Supabase CLI: supabase login
 * 3. Link your project: supabase link --project-ref <your-project-ref>
 * 4. Run the migration: node scripts/run-migration.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Path to the migration file
const migrationFilePath = path.join(__dirname, '..', 'supabase', 'migrations', '20240401_remove_general_list.sql');

// Check if the migration file exists
if (!fs.existsSync(migrationFilePath)) {
  console.error('Migration file not found:', migrationFilePath);
  process.exit(1);
}

try {
  // Run the migration using Supabase CLI
  console.log('Running migration to remove is_general field...');
  execSync(`supabase db push --db-url postgresql://postgres:postgres@localhost:54322/postgres`, {
    stdio: 'inherit'
  });
  
  console.log('\nMigration completed successfully!');
  console.log('\nAlternatively, you can run the following SQL directly in the Supabase SQL editor:');
  console.log('\nALTER TABLE public.shopping_lists DROP COLUMN IF EXISTS is_general;');
} catch (error) {
  console.error('Error running migration:', error.message);
  console.error('\nYou can run the following SQL directly in the Supabase SQL editor:');
  console.error('\nALTER TABLE public.shopping_lists DROP COLUMN IF EXISTS is_general;');
  process.exit(1);
} 