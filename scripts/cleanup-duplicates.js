import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

// Load environment variables
const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, '../.env') })

// Create Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase URL and Key must be provided in environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function findDuplicates() {
  // First get all products
  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at')

  if (error) throw error

  // Find duplicates by name
  const duplicateNames = products.reduce((acc, product) => {
    if (!acc[product.name]) {
      acc[product.name] = []
    }
    acc[product.name].push(product)
    return acc
  }, {})

  // Filter to only names with multiple products
  return Object.entries(duplicateNames)
    .filter(([_, products]) => products.length > 1)
    .map(([name, products]) => ({
      name,
      count: products.length,
      products
    }))
}

async function mergeDuplicates() {
  // Get all duplicates
  const duplicates = await findDuplicates()
  console.log('Found duplicates:', duplicates.map(d => `${d.name} (${d.count} instances)`))
  
  for (const dup of duplicates) {
    // Keep the first (oldest) product
    const keepProduct = dup.products[0]
    const deleteIds = dup.products.slice(1).map(p => p.id)

    console.log(`Merging duplicates for "${dup.name}". Keeping ID ${keepProduct.id}, deleting IDs ${deleteIds.join(', ')}`)

    // Update shopping items to point to the kept product
    const { error: updateError } = await supabase
      .from('shopping_items')
      .update({ product_id: keepProduct.id })
      .in('product_id', deleteIds)

    if (updateError) {
      console.error('Error updating shopping items:', updateError)
      continue
    }

    // Delete the duplicate products
    const { error: deleteError } = await supabase
      .from('products')
      .delete()
      .in('id', deleteIds)

    if (deleteError) {
      console.error('Error deleting duplicate products:', deleteError)
      continue
    }
  }
}

async function addUniqueConstraint() {
  const { error } = await supabase.rpc('add_unique_constraint')
  if (error) throw error
}

async function cleanup() {
  try {
    console.log('Finding and merging duplicate products...')
    await mergeDuplicates()
    console.log('Merged duplicate products')
    
    console.log('Adding unique constraint...')
    await addUniqueConstraint()
    console.log('Cleanup completed successfully!')
  } catch (error) {
    console.error('Error during cleanup:', error)
  } finally {
    process.exit()
  }
}

cleanup() 